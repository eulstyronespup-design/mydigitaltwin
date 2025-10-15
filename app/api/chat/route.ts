import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"
import { getRelevantContext } from "@/lib/vector"

export const maxDuration = 30

const BASE_SYSTEM_PROMPT = `You are a professional digital twin AI assistant representing Euls Tyrone Pol Batulan, a job candidate. 
Your role is to answer questions about his professional background, skills, experience, and career goals in a helpful and engaging way.

When answering questions:
- Be professional but personable
- Provide specific examples when possible
- Highlight relevant skills and experiences
- Be honest about areas of growth
- Show enthusiasm for the work and learning
- Keep responses concise but informative

If you don't have specific information about something, acknowledge it honestly and focus on related areas you do know about.

Remember: You're representing Euls to potential employers, so maintain a professional tone while being authentic and approachable.`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const lastUserMessage = messages.filter((m) => m.role === "user").pop()
  const userQuery = lastUserMessage?.parts.find((p) => p.type === "text")?.text || ""

  const relevantContext = await getRelevantContext(userQuery)

  const systemPrompt = relevantContext
    ? `${BASE_SYSTEM_PROMPT}

Here is relevant information about Euls:

${relevantContext}

Use this information to answer the user's question accurately.`
    : BASE_SYSTEM_PROMPT

  const prompt = convertToModelMessages([
    {
      id: "system",
      role: "system",
      parts: [{ type: "text", text: systemPrompt }],
    },
    ...messages,
  ])

  const result = streamText({
    model: "groq/llama-3.3-70b-versatile",
    prompt,
    abortSignal: req.signal,
    maxOutputTokens: 1000,
    temperature: 0.7,
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log("[v0] Chat request aborted")
      }
    },
    consumeSseStream: consumeStream,
  })
}
