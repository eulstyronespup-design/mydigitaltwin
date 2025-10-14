import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { runMcpChat } from '../../actions/mcp.server';

// Add a small typed shape for incoming JSON-RPC requests
interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: { question?: string; topK?: number | string } | Record<string, unknown> | null;
}

interface JsonRpcErrorResponse {
  jsonrpc: string;
  id: string | number | null;
  error: {
    code: number;
    message: string;
    raw?: string;
    parseMessage?: string;
    stack?: string;
  };
}

function isLocal() {
  return process.env.NODE_ENV !== 'production';
}

// remove unused GET param to satisfy linter
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'MCP endpoint (GET) - use POST with JSON-RPC { method: "chat", params: { question } }',
  });
}

export async function POST(req: NextRequest) {
  let requestId: unknown = null;

  // log headers for debugging
  try {
    console.info('[MCP ROUTE] Incoming headers:', Object.fromEntries(req.headers.entries()));
  } catch (e) {
    console.info('[MCP ROUTE] Could not enumerate headers:', String(e));
  }

  // Read raw text first so we can log it if parse fails
  let rawText: string;
  try {
    rawText = await req.text();
    console.info('[MCP ROUTE] Raw request body:', isLocal() ? rawText : '[redacted in production]');
  } catch (e: unknown) {
    console.error('[MCP ROUTE] Failed to read request body:', e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Failed to read request body' } },
      { status: 400 }
    );
  }

  // Parse JSON with a helpful error message
  let body: JsonRpcRequest;
  try {
    body = rawText ? (JSON.parse(rawText) as JsonRpcRequest) : {};
  } catch (e: unknown) {
    console.error('[MCP ROUTE] JSON parse error:', e instanceof Error ? e.message : String(e));
    // On dev, include the raw body for debugging.
    const payload: JsonRpcErrorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Invalid JSON payload' },
    };
    if (isLocal()) {
      payload.error.raw = rawText;
      payload.error.parseMessage = e instanceof Error ? e.message : String(e);
    }
    return NextResponse.json(payload, { status: 400 });
  }

  try {
    const { method, params, id } = body ?? {};
    requestId = id ?? null;

    if (method !== 'chat') {
      console.warn('[MCP ROUTE] Unknown method:', method);
      return NextResponse.json(
        { jsonrpc: '2.0', id: id ?? null, error: { code: -32601, message: 'Unknown method; expected "chat"' } },
        { status: 400 }
      );
    }

    const question = params?.question ?? '';
    const topK = Number((params as { topK?: number | string } | undefined)?.topK ?? 3);

    if (!question || !String(question).trim()) {
      console.warn('[MCP ROUTE] Missing question param for id:', requestId);
      return NextResponse.json(
        { jsonrpc: '2.0', id: id ?? null, error: { code: -32602, message: 'Missing question param' } },
        { status: 400 }
      );
    }

    // Good request — call the server action
    console.info('[MCP ROUTE] Calling runMcpChat for id:', requestId);
    const answer = await runMcpChat(String(question), topK);
    console.info('[MCP ROUTE] Answer ready for id:', requestId);
    return NextResponse.json({ jsonrpc: '2.0', id, result: { answer } });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error && err.stack ? err.stack : undefined;
    console.error('[MCP ROUTE ERROR]', { requestId, message: errMessage, stack: errStack });
    const payload: JsonRpcErrorResponse = {
      jsonrpc: '2.0',
      id: requestId as string | number | null,
      error: { code: -32603, message: errMessage },
    };
    if (isLocal() && errStack) {
      payload.error.stack = errStack;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}