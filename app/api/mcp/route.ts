import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { runMcpChat } from '../../actions/mcp.server';

function isLocal() {
  return process.env.NODE_ENV !== 'production';
}

export async function GET(req: NextRequest) {
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
  } catch (e: any) {
    console.error('[MCP ROUTE] Failed to read request body:', e?.message ?? e);
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Failed to read request body' } },
      { status: 400 }
    );
  }

  // Parse JSON with a helpful error message
  let body: any;
  try {
    body = rawText ? JSON.parse(rawText) : {};
  } catch (e: any) {
    console.error('[MCP ROUTE] JSON parse error:', e?.message ?? e);
    // On dev, include the raw body for debugging.
    const payload: any = {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Invalid JSON payload' },
    };
    if (isLocal()) {
      payload.error.raw = rawText;
      payload.error.parseMessage = String(e?.message ?? e);
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
    const topK = Number(params?.topK ?? 3);

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
  } catch (err: any) {
    console.error('[MCP ROUTE ERROR]', { requestId, message: err?.message, stack: err?.stack });
    const safeMessage = err?.message ?? 'Internal error';
    const payload: any = {
      jsonrpc: '2.0',
      id: requestId ?? null,
      error: { code: -32603, message: safeMessage },
    };
    if (isLocal() && err?.stack) {
      payload.error.stack = err.stack;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}