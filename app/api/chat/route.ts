import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

const SYSTEM_PROMPT = `You are a professional digital twin AI assistant representing a job candidate. 
Your role is to answer questions about their professional background, skills, experience, and career goals in a helpful and engaging way.

When answering questions:
- Be professional but personable
- Provide specific examples when possible
- Highlight relevant skills and experiences
- Be honest about areas of growth
- Show enthusiasm for the work and learning
- Keep responses concise but informative

If you don't have specific information about something, acknowledge it honestly and focus on related areas you do know about.

Remember: You're representing someone to potential employers, so maintain a professional tone while being authentic and approachable.`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const prompt = convertToModelMessages([
    {
      id: "system",
      role: "system",
      parts: [{ type: "text", text: SYSTEM_PROMPT }],
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
