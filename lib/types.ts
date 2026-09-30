export type Phase = "study" | "distraction" | "recall" | "recognition" | "results";

export type RecognitionAnswer = "yes" | "no";
export type RecognitionAnswers = Record<string, RecognitionAnswer>;

export interface SessionState {
  wordList: string[];
  foilList: string[];
  freeRecallWords: string[];
  recognitionAnswers: RecognitionAnswers;
}

export interface FreeRecallStats {
  hits: string[];
  misses: string[];
  intrusions: string[];
}

export interface RecognitionStats {
  hits: number;
  falseAlarms: number;
  discriminationScore: number;
}

// POST /api/sessions request body — raw session inputs; the server recomputes all derived scores.
export interface CreateSessionRequest {
  wordList: string[];
  foilList: string[];
  freeRecallWords: string[];
  recognitionAnswers: RecognitionAnswers;
}

export interface CreateSessionResponse {
  id: string;
  createdAt: string;
}
