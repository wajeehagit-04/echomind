import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { sessions } from "@/db/schema";
import { computeFreeRecallStats, computeRecognitionStats } from "@/lib/scoring";
import type { CreateSessionRequest, CreateSessionResponse } from "@/lib/types";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecognitionAnswers(
  value: unknown
): value is CreateSessionRequest["recognitionAnswers"] {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value).every((answer) => answer === "yes" || answer === "no");
}

function parseRequestBody(body: unknown): CreateSessionRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const { wordList, foilList, freeRecallWords, recognitionAnswers } = body as Record<
    string,
    unknown
  >;

  if (
    !isStringArray(wordList) ||
    !isStringArray(foilList) ||
    !isStringArray(freeRecallWords) ||
    !isRecognitionAnswers(recognitionAnswers)
  ) {
    return null;
  }

  return { wordList, foilList, freeRecallWords, recognitionAnswers };
}

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = parseRequestBody(rawBody);
  if (!body) {
    return NextResponse.json({ error: "Invalid session payload" }, { status: 400 });
  }

  const { wordList, foilList, freeRecallWords, recognitionAnswers } = body;

  // Scores are recomputed here rather than trusted from the request body, so the
  // persisted values can't be tampered with and there's one implementation of the rules.
  const freeRecall = computeFreeRecallStats(wordList, freeRecallWords);
  const recognition = computeRecognitionStats(wordList, foilList, recognitionAnswers);

  const [inserted] = await db
    .insert(sessions)
    .values({
      wordList,
      foilList,
      freeRecallWords,
      freeRecallHits: freeRecall.hits.length,
      freeRecallIntrusions: freeRecall.intrusions,
      recognitionAnswers,
      recognitionHits: recognition.hits,
      recognitionFalseAlarms: recognition.falseAlarms,
      discriminationScore: recognition.discriminationScore,
    })
    .returning({ id: sessions.id, createdAt: sessions.createdAt });

  const response: CreateSessionResponse = {
    id: inserted.id,
    createdAt: inserted.createdAt.toISOString(),
  };

  return NextResponse.json(response, { status: 201 });
}
