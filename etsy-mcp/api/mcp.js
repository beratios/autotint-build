import { createMcpHandler } from "mcp-handler";
import { registerTools } from "../lib/tools.js";
import { keyOk } from "../lib/auth.js";

const handler = createMcpHandler((server) => registerTools(server), {
  serverInfo: { name: "monarq-etsy", version: "1.0.0" },
});

async function guarded(request) {
  if (!keyOk(request)) return new Response("Unauthorized", { status: 401 });
  return handler(request);
}
export const GET = guarded, POST = guarded, DELETE = guarded;
