import { NextResponse } from "next/server"
import { Index } from "@upstash/vector"
import Groq from "groq-sdk"

const vector = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { method, params, id } = body

    if (method !== "chat") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: "Method not found" },
      })
    }

    const question = params?.question || ""

    // Create embedding using Groq
    const embedResp = await groq.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    })
    const embedding = embedResp.data[0].embedding

    // Query vector database
    const searchResp = await vector.query({
      vector: embedding,
      topK: 3,
      includeMetadata: true,
    })

    const context = searchResp
      ?.map((m) => m.metadata?.content)
      .filter(Boolean)
      .join("\n\n")

    // Generate response using Groq
    const chat = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are Euls Tyrone Pol Batulan's digital twin. Answer questions as if you are him, using the provided context about his background, skills, and experience. Be professional and concise.",
        },
        {
          role: "user",
          content: `Question: ${question}\n\nContext: ${context}`,
        },
      ],
    })

    const answer = chat.choices[0].message.content

    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      result: { answer },
    })
  } catch (error) {
    console.error("[v0] MCP API error:", error)
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32603,
        message: "Internal error",
        data: error instanceof Error ? error.message : "Unknown error",
      },
    })
  }
}
