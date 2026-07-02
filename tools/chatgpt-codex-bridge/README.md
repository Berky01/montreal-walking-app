# ChatGPT Codex Bridge

This local bridge exposes the Travel routes project to ChatGPT web as an MCP connector.

It wraps Codex CLI's stdio MCP server and fixes the working directory to this project:

```text
C:\Users\valen\Documents\Travel routes
```

## Run

```powershell
npm run bridge:codex
```

Local MCP endpoint:

```text
http://127.0.0.1:8797/mcp
```

Health check:

```text
http://127.0.0.1:8797/healthz
```

## Connect From ChatGPT Web

ChatGPT web requires an HTTPS-reachable MCP endpoint. For local development, use OpenAI Secure MCP Tunnel, ngrok, or Cloudflare Tunnel to expose `http://127.0.0.1:8797/mcp`.

In ChatGPT web:

1. Open Settings -> Apps & Connectors -> Advanced settings.
2. Enable developer mode if it is available for the account/workspace.
3. Go to Settings -> Connectors -> Create.
4. Name the connector `Meaningful Routes Codex`.
5. Use a description like: `Send prompts from ChatGPT to Codex for the local Meaningful Routes Travel routes project. Can start new sessions or continue existing sessions by thread id.`
6. Use the tunnel HTTPS URL ending in `/mcp`.

## Tools

- `routes_codex_prompt`: start a new Codex session when `threadId` is omitted, or continue the supplied `threadId`.
- `routes_codex_recent_sessions`: list recent local Codex sessions related to this project.

Example ChatGPT prompt:

```text
Use Meaningful Routes Codex to prompt Codex: implement P0-007 and keep changes scoped.
```

Example continuation:

```text
Use Meaningful Routes Codex to continue thread 019f1f2a-4871-7f40-b5c7-e62061dfe443: run the final validation sequence and report blockers.
```

## Security

This bridge can trigger Codex to edit and run commands in the local project. Keep it bound to localhost and expose it only through a tunnel you control.
