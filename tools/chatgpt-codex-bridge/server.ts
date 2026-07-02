import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createInterface, type Interface } from "node:readline";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method: string;
  params?: unknown;
};

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
};

type ToolCallResult = {
  structuredContent?: JsonObject;
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
};

type SessionIndexEntry = {
  id: string;
  thread_name?: string;
  updated_at?: string;
};

type SessionMeta = {
  id: string;
  cwd?: string;
  sourceFile: string;
};

const bridgeDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(bridgeDir, "..", "..");
const port = Number.parseInt(process.env.ROUTES_BRIDGE_PORT ?? "8797", 10);
const host = process.env.ROUTES_BRIDGE_HOST ?? "127.0.0.1";
const userHome = homedir();

const defaultCodexPaths = [
  process.env.CODEX_CLI_PATH,
  process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "OpenAI", "Codex", "bin", "ea1c60319a1dcb19", "codex.exe")
    : undefined,
  path.join(userHome, ".codex", "plugins", ".plugin-appserver", "codex.exe"),
  "codex",
].filter((candidate): candidate is string => Boolean(candidate));

const codexPath = defaultCodexPaths.find((candidate) => candidate === "codex" || existsSync(candidate)) ?? "codex";
const codexRequestTimeoutMs = Number.parseInt(process.env.ROUTES_CODEX_TIMEOUT_MS ?? "3600000", 10);
const maxBodyBytes = 1024 * 1024;

const tools: JsonValue[] = [
  {
    name: "routes_codex_prompt",
    description:
      "Start or continue a Codex session in the local Meaningful Routes / Travel routes project. Omit threadId to start a new Codex session; include threadId to continue that exact session.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The request to send to Codex.",
        },
        threadId: {
          type: "string",
          description: "Existing Codex thread/session id to continue. Leave blank to start a new session.",
        },
        ticketFile: {
          type: "string",
          description:
            "Optional ticket file under meaningful_routes_codex_handoff/tickets, for example P0_MVP/P0-007_route_detail_and_map.md.",
        },
      },
      required: ["prompt"],
      additionalProperties: false,
    },
    annotations: {
      title: "Prompt Meaningful Routes Codex",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
  } as JsonObject,
  {
    name: "routes_codex_recent_sessions",
    description:
      "List recent local Codex sessions for the Meaningful Routes / Travel routes project so the user can choose an existing threadId.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of sessions to return. Defaults to 10.",
        },
        query: {
          type: "string",
          description: "Optional case-insensitive filter applied to title or thread id.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      title: "List Meaningful Routes Codex Sessions",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  } as JsonObject,
];

class CodexMcpClient {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private rl: Interface | null = null;
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private initialized = false;
  private stderrLines: string[] = [];
  private startPromise: Promise<void> | null = null;

  async callTool(name: string, args: JsonObject): Promise<ToolCallResult> {
    await this.ensureStarted();
    const response = await this.request("tools/call", { name, arguments: args }, codexRequestTimeoutMs);
    return isRecord(response) ? (response as ToolCallResult) : {};
  }

  private async ensureStarted(): Promise<void> {
    if (this.initialized && this.proc && !this.proc.killed) {
      return;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    this.startPromise = this.start();
    try {
      await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  private async start(): Promise<void> {
    this.proc = spawn(codexPath, ["mcp-server"], {
      cwd: projectDir,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.proc.stderr.on("data", (chunk: Buffer) => {
      this.stderrLines.push(chunk.toString("utf8").trim());
      this.stderrLines = this.stderrLines.slice(-20);
    });

    this.proc.on("exit", (code, signal) => {
      this.initialized = false;
      const reason = new Error(`Codex MCP server exited with code ${code ?? "null"} and signal ${signal ?? "null"}.`);
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(reason);
      }
      this.pending.clear();
      this.proc = null;
      this.rl?.close();
      this.rl = null;
    });

    this.rl = createInterface({ input: this.proc.stdout });
    this.rl.on("line", (line) => this.handleLine(line));

    await this.request(
      "initialize",
      {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: {
          name: "meaningful-routes-chatgpt-bridge",
          version: "0.1.0",
        },
      },
      30000,
    );
    this.notify("notifications/initialized", {});
    this.initialized = true;
  }

  private request(method: string, params: JsonValue, timeoutMs: number): Promise<unknown> {
    if (!this.proc) {
      return Promise.reject(new Error("Codex MCP server is not running."));
    }

    const id = this.nextId;
    this.nextId += 1;

    const message = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for Codex MCP response to ${method}.`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.proc?.stdin.write(`${JSON.stringify(message)}\n`);
    });
  }

  private notify(method: string, params: JsonValue): void {
    this.proc?.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
  }

  private handleLine(line: string): void {
    let message: unknown;
    try {
      message = JSON.parse(line);
    } catch {
      this.stderrLines.push(line);
      this.stderrLines = this.stderrLines.slice(-20);
      return;
    }

    if (!isRecord(message) || typeof message.id !== "number") {
      return;
    }

    const pending = this.pending.get(message.id);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timer);
    this.pending.delete(message.id);

    if (isRecord(message.error)) {
      pending.reject(new Error(`${String(message.error.message ?? "Codex MCP error")}\n${this.stderrTail()}`.trim()));
      return;
    }

    pending.resolve(message.result);
  }

  private stderrTail(): string {
    return this.stderrLines.filter(Boolean).slice(-5).join("\n");
  }
}

const codex = new CodexMcpClient();

const server = createServer(async (req, res) => {
  try {
    await routeRequest(req, res);
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected bridge error.",
    });
  }
});

server.listen(port, host, () => {
  console.log(`Meaningful Routes Codex bridge listening on http://${host}:${port}/mcp`);
  console.log(`Project: ${projectDir}`);
  console.log(`Codex CLI: ${codexPath}`);
});

async function routeRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `${host}:${port}`}`);

  if (req.method === "GET" && url.pathname === "/healthz") {
    sendJson(res, 200, {
      status: "ok",
      projectDir,
      codexPath,
      endpoint: `http://${host}:${port}/mcp`,
    });
    return;
  }

  if (url.pathname !== "/mcp") {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, {
      status: "ok",
      message: "POST JSON-RPC MCP requests to this endpoint.",
    });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const body = await readBody(req);
  const payload = JSON.parse(body) as unknown;
  const result = Array.isArray(payload)
    ? await Promise.all(payload.map((item) => handleJsonRpc(item)))
    : await handleJsonRpc(payload);

  if (result === null) {
    res.writeHead(202).end();
    return;
  }

  sendJson(res, 200, result);
}

async function handleJsonRpc(payload: unknown): Promise<JsonObject | null> {
  if (!isJsonRpcRequest(payload)) {
    return rpcError(null, -32600, "Invalid JSON-RPC request.");
  }

  if (payload.id === undefined || payload.id === null) {
    await handleNotification();
    return null;
  }

  try {
    const result = await dispatch(payload.method, payload.params);
    return {
      jsonrpc: "2.0",
      id: payload.id,
      result,
    };
  } catch (error) {
    return rpcError(payload.id, -32000, error instanceof Error ? error.message : "Bridge request failed.");
  }
}

async function handleNotification(): Promise<void> {
  return;
}

async function dispatch(method: string, params: unknown): Promise<JsonValue> {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: "2025-06-18",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "meaningful-routes-codex-bridge",
          version: "0.1.0",
        },
        instructions:
          "Use this connector to send development prompts to Codex for the local Meaningful Routes project. Use recent sessions first when the user asks to continue existing work.",
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools };
    case "resources/list":
      return { resources: [] };
    case "prompts/list":
      return { prompts: [] };
    case "tools/call":
      return callBridgeTool(params);
    default:
      throw new Error(`Unsupported MCP method: ${method}`);
  }
}

async function callBridgeTool(params: unknown): Promise<JsonValue> {
  if (!isRecord(params) || typeof params.name !== "string") {
    throw new Error("tools/call requires a string tool name.");
  }

  const args = isRecord(params.arguments) ? params.arguments : {};

  if (params.name === "routes_codex_recent_sessions") {
    return recentSessionsResult(args);
  }

  if (params.name === "routes_codex_prompt") {
    return promptCodex(args);
  }

  throw new Error(`Unknown tool: ${params.name}`);
}

async function promptCodex(args: Record<string, unknown>): Promise<JsonValue> {
  const prompt = asString(args.prompt).trim();
  if (!prompt) {
    throw new Error("prompt is required.");
  }

  const threadId = asString(args.threadId).trim();
  const ticketFile = asString(args.ticketFile).trim();
  const formattedPrompt = formatPrompt(prompt, ticketFile);
  const toolName = threadId ? "codex-reply" : "codex";
  const toolArgs: JsonObject = threadId
    ? {
        threadId,
        prompt: formattedPrompt,
      }
    : {
        prompt: formattedPrompt,
        cwd: projectDir,
        sandbox: "danger-full-access",
        "approval-policy": "never",
      };

  const result = await codex.callTool(toolName, toolArgs);
  const returnedThreadId = extractThreadId(result) ?? threadId;
  const text = extractText(result) || `Codex ${threadId ? "continued" : "started"} successfully.`;
  const summary = [
    `Codex ${threadId ? "continued" : "started"} for Meaningful Routes.`,
    returnedThreadId ? `Thread ID: ${returnedThreadId}` : undefined,
    text,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    structuredContent: {
      action: threadId ? "continued" : "started",
      projectDir,
      threadId: returnedThreadId,
      content: text,
    },
    content: [{ type: "text", text: summary }],
  };
}

function recentSessionsResult(args: Record<string, unknown>): JsonValue {
  const rawLimit = Number(args.limit ?? 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 25) : 10;
  const query = asString(args.query).trim().toLowerCase();
  const sessions = readRecentSessions(limit, query);
  const text =
    sessions.length === 0
      ? "No recent Meaningful Routes Codex sessions were found."
      : sessions
          .map((session) => `${session.updatedAt ?? "unknown"} | ${session.title} | ${session.id}`)
          .join("\n");

  return {
    structuredContent: {
      projectDir,
      sessions: sessions.map((session) => {
        const item: JsonObject = {
          id: session.id,
          title: session.title,
        };

        if (session.updatedAt) {
          item.updatedAt = session.updatedAt;
        }

        if (session.cwd) {
          item.cwd = session.cwd;
        }

        return item;
      }),
    },
    content: [{ type: "text", text }],
  };
}

function formatPrompt(prompt: string, ticketFile: string): string {
  const lines = [
    "You are working on Meaningful Routes in the local Travel routes project.",
    `Project directory: ${projectDir}`,
    "",
    "Follow AGENTS.md and project-local instructions first.",
    "Preserve the existing visual MVP unless explicitly asked to redesign.",
    "Keep DATA_SOURCE=mock as the default and keep mock/JSON fallback mode working.",
    "Inspect the owning files before changing behavior, keep edits scoped, and do not print secrets.",
    "If code changes, run the narrowest validation that proves the change; for final app changes, run the project validation sequence and deploy live or report the deployment blocker.",
  ];

  if (ticketFile) {
    lines.push("", `Relevant ticket file: meaningful_routes_codex_handoff/tickets/${ticketFile}`);
  }

  lines.push("", "User request:", prompt);
  return lines.join("\n");
}

function readRecentSessions(limit: number, query: string): Array<{ id: string; title: string; updatedAt?: string; cwd?: string }> {
  const indexPath = path.join(userHome, ".codex", "session_index.jsonl");
  if (!existsSync(indexPath)) {
    return [];
  }

  const entries = readJsonLines(indexPath)
    .map(parseSessionIndexEntry)
    .filter((entry): entry is SessionIndexEntry => Boolean(entry))
    .reverse();

  const metas = readSessionMetas(250);
  const matches: Array<{ id: string; title: string; updatedAt?: string; cwd?: string }> = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.id)) {
      continue;
    }
    seen.add(entry.id);

    const meta = metas.get(entry.id);
    const title = entry.thread_name ?? "Untitled Codex session";
    const titleMatch = `${title} ${entry.id}`.toLowerCase().includes(query);
    const cwdMatch = pathsEqual(meta?.cwd, projectDir);
    const routeTitleFallback = /\b(routes?|meaningful)\b/i.test(title);

    if ((cwdMatch || routeTitleFallback) && (!query || titleMatch)) {
      matches.push({
        id: entry.id,
        title,
        updatedAt: entry.updated_at,
        cwd: meta?.cwd,
      });
    }

    if (matches.length >= limit) {
      break;
    }
  }

  return matches;
}

function readSessionMetas(maxFiles: number): Map<string, SessionMeta> {
  const sessionsDir = path.join(userHome, ".codex", "sessions");
  const metas = new Map<string, SessionMeta>();
  if (!existsSync(sessionsDir)) {
    return metas;
  }

  const files = listJsonlFiles(sessionsDir)
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
    .slice(0, maxFiles);

  for (const file of files) {
    const firstLine = readFirstLine(file);
    if (!firstLine) {
      continue;
    }

    const parsed = safeJsonParse(firstLine);
    if (!isRecord(parsed) || parsed.type !== "session_meta" || !isRecord(parsed.payload)) {
      continue;
    }

    const id = asString(parsed.payload.id || parsed.payload.session_id);
    if (!id) {
      continue;
    }

    metas.set(id, {
      id,
      cwd: asString(parsed.payload.cwd) || undefined,
      sourceFile: file,
    });
  }

  return metas;
}

function listJsonlFiles(root: string): string[] {
  const files: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function readJsonLines(file: string): unknown[] {
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map(safeJsonParse)
    .filter((value) => value !== null);
}

function readFirstLine(file: string): string | null {
  const text = readFileSync(file, "utf8");
  const newline = text.indexOf("\n");
  return newline === -1 ? text : text.slice(0, newline);
}

function parseSessionIndexEntry(value: unknown): SessionIndexEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id);
  if (!id) {
    return null;
  }

  return {
    id,
    thread_name: asString(value.thread_name) || undefined,
    updated_at: asString(value.updated_at) || undefined,
  };
}

function extractThreadId(result: ToolCallResult): string | undefined {
  const structured = result.structuredContent;
  return structured ? asString(structured.threadId) : undefined;
}

function extractText(result: ToolCallResult): string {
  const structuredContent = result.structuredContent;
  if (structuredContent && typeof structuredContent.content === "string") {
    return structuredContent.content;
  }

  return (result.content ?? [])
    .map((item) => item.text)
    .filter((text): text is string => Boolean(text))
    .join("\n");
}

function pathsEqual(left: string | undefined, right: string): boolean {
  if (!left) {
    return false;
  }

  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  return isRecord(value) && typeof value.method === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeJsonParse(text: string): unknown | null {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function rpcError(id: string | number | null, code: number, message: string): JsonObject {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message },
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error("Request body too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: JsonValue): void {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
}
