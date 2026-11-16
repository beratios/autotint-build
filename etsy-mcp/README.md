# monarq-etsy-mcp
Own Etsy MCP server (replacement for AnythingMCP). Deployed on Vercel project `monarq-etsy-mcp` (https://monarq-etsy-mcp.vercel.app).
Tokens stored in Neon project `monarq-etsy-mcp` (little-cell-61917825), table kv.
Env: DATABASE_URL, MCP_KEY (secret, required as ?key= on /api/mcp and /api/setup), ETSY_SHOP_ID.
- /api/setup?key=… : enter Etsy Keystring + Shared Secret, then Etsy OAuth (PKCE). Callback: /api/oauth/callback (must be added in the Etsy app).
- /api/mcp?key=… : MCP endpoint (Streamable HTTP). Tool names mirror AnythingMCP's etsy_* tools (+ etsy_set_price, etsy_status).
