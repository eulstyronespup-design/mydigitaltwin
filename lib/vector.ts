// Utility functions for Upstash Vector database operations

interface VectorMatch {
  id: string
  score: number
  metadata: {
    title: string
    content: string
  }
}

/**
 * Embed a text query using Groq's embedding API
 */
export async function embedQuery(query: string): Promise<number[]> {
  const response = await fetch("https://api.groq.com/openai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query,
    }),
  })

  if (!response.ok) {
    throw new Error(`Embedding failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

/**
 * Query the Upstash Vector database for relevant context
 */
export async function queryVectorDB(embedding: number[], topK = 3): Promise<VectorMatch[]> {
  const response = await fetch(`${process.env.UPSTASH_VECTOR_REST_URL}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_VECTOR_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vector: embedding,
      topK,
      includeMetadata: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`Vector query failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.result || []
}

/**
 * Get relevant context for a user query using RAG
 */
export async function getRelevantContext(query: string): Promise<string> {
  try {
    // Embed the query
    const embedding = await embedQuery(query)

    // Query the vector database
    const matches = await queryVectorDB(embedding, 3)

    // Format the context
    if (matches.length === 0) {
      return ""
    }

    const context = matches.map((match) => `${match.metadata.title}: ${match.metadata.content}`).join("\n\n")

    return context
  } catch (error) {
    console.error("[v0] Error getting relevant context:", error)
    return ""
  }
}
