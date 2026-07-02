import { searchRoutes } from "@/lib/data/index";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { query?: string } | null;
  const query = body?.query?.trim();

  if (!query) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  const results = searchRoutes(query);

  return Response.json({
    query,
    intent: results[0]?.intent,
    results
  });
}
