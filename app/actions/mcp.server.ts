'use server';

import { Index } from '@upstash/vector';
import OpenAI from 'openai';

type UpstashMatch = {
  id?: string;
  score?: number;
  metadata?: {
    content?: string;
    title?: string;
    [key: string]: any;
  };
};

/**
 * Helper to ensure required env vars exist at call time (not import time).
 * Returns the value or throws a descriptive Error.
 */
function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

/**
 * runMcpChat - server-side RAG flow:
 *  - create embedding for question via Groq embeddings
 *  - query Upstash Vector with embedding (topK)
 *  - build context from matches' metadata.content
 *  - call Groq chat completion (llama3) and return answer string
 *
 * All clients are created inside the function so module import never fails.
 */
export async function runMcpChat(question: string, topK = 3): Promise<string> {
  if (!question || !question.trim()) {
    throw new Error('Missing question');
  }

  // Validate envs now (at request time)
  const UPSTASH_VECTOR_REST_URL = getRequiredEnv('UPSTASH_VECTOR_REST_URL');
  const UPSTASH_VECTOR_REST_TOKEN = getRequiredEnv('UPSTASH_VECTOR_REST_TOKEN');
  const GROQ_API_KEY = getRequiredEnv('GROQ_API_KEY');

  // create clients here
  const index = new Index({
    url: UPSTASH_VECTOR_REST_URL,
    token: UPSTASH_VECTOR_REST_TOKEN,
  });

  const client = new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  try {
    // 1) Create embedding using Groq embeddings
    const embedResp = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: question,
    });

    const embedding = embedResp?.data?.[0]?.embedding;
    if (!embedding) throw new Error('Failed to create embedding (empty embedding returned)');

    // 2) Query Upstash Vector (Index) for nearest neighbors
    const searchResp = await index.query({
      data: embedding,
      topK,
      includeMetadata: true,
    });

    const matches = (searchResp?.matches ?? []) as UpstashMatch[];

    // 3) Build context from metadata.content
    const context = matches
      .map((m) => {
        const meta = m.metadata ?? {};
        if (meta.content) {
          return `${meta.title ? meta.title + ': ' : ''}${meta.content}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');

    // 4) Call Groq chat completion (LLaMA) to generate answer
    const systemPrompt = "You are Euls Tyrone's digital twin. Answer as if you are him.";
    const userPrompt = `Question: ${question}\n\nContext: ${context}`;

    const chat = await client.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const answer = chat?.choices?.[0]?.message?.content;
    if (!answer) throw new Error('No answer returned from Groq chat completion');

    return answer;
  } catch (err: any) {
    const wrapped = new Error(`runMcpChat error: ${err?.message ?? String(err)}`);
    if (err?.stack) wrapped.stack = `${wrapped.stack}\n\n[original stack]\n${err.stack}`;
    throw wrapped;
  }
}