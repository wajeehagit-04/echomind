import type { FreeRecallStats, RecognitionAnswers, RecognitionStats } from "./types";

export function computeFreeRecallStats(
  wordList: string[],
  freeRecallWords: string[]
): FreeRecallStats {
  const recalledSet = new Set(freeRecallWords);
  const studySet = new Set(wordList);

  const hits = wordList.filter((word) => recalledSet.has(word));
  const misses = wordList.filter((word) => !recalledSet.has(word));
  const intrusions = [...new Set(freeRecallWords.filter((word) => !studySet.has(word)))];

  return { hits, misses, intrusions };
}

export function computeRecognitionStats(
  wordList: string[],
  foilList: string[],
  recognitionAnswers: RecognitionAnswers
): RecognitionStats {
  const hits = wordList.filter((word) => recognitionAnswers[word] === "yes").length;
  const falseAlarms = foilList.filter((word) => recognitionAnswers[word] === "yes").length;

  return {
    hits,
    falseAlarms,
    discriminationScore: hits - falseAlarms,
  };
}
