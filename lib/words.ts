// SET_A_CLASSIC is the real, validated CERAD Word List Memory Test instrument.
// SET_B_ALT and SET_C_ALT mirror its category structure but are not independently validated.
export const SET_A_CLASSIC: string[] = [
  "butter",
  "arm",
  "shore",
  "letter",
  "queen",
  "cabin",
  "pole",
  "ticket",
  "grass",
  "engine",
];

export const SET_B_ALT: string[] = [
  "cotton",
  "foot",
  "valley",
  "ribbon",
  "king",
  "cottage",
  "ladder",
  "coupon",
  "sand",
  "motor",
];

export const SET_C_ALT: string[] = [
  "silver",
  "shoulder",
  "meadow",
  "envelope",
  "prince",
  "tower",
  "fence",
  "receipt",
  "gravel",
  "wheel",
];

export const FOIL_POOL: string[] = [
  "ocean",
  "chair",
  "window",
  "garden",
  "bridge",
  "pencil",
  "forest",
  "river",
  "candle",
  "hammer",
  "mountain",
  "blanket",
  "mirror",
  "doctor",
  "orange",
  "pillow",
  "jacket",
  "kitchen",
  "thunder",
  "whistle",
];

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateSession(): { wordList: string[]; foilList: string[] } {
  const pool = shuffle([...SET_A_CLASSIC, ...SET_B_ALT, ...SET_C_ALT]);
  const wordList = pool.slice(0, 10);
  const unselectedPoolWords = pool.slice(10);

  const wordSet = new Set(wordList);
  const foilCandidates = [...unselectedPoolWords, ...FOIL_POOL].filter(
    (word) => !wordSet.has(word)
  );
  const foilList = shuffle(foilCandidates).slice(0, 10);

  return { wordList, foilList };
}
