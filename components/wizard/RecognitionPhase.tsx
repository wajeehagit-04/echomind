"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { RecognitionAnswer, RecognitionAnswers } from "@/lib/types";

interface RecognitionPhaseProps {
  wordList: string[];
  foilList: string[];
  onSubmit: (answers: RecognitionAnswers) => void;
}

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function optionClasses(selected: boolean): string {
  return `cursor-pointer rounded-md border px-3 py-1 text-xs ${
    selected ? "border-accent bg-accent text-background" : "border-hairline text-muted"
  }`;
}

export function RecognitionPhase({ wordList, foilList, onSubmit }: RecognitionPhaseProps) {
  const words = useMemo(() => shuffle([...wordList, ...foilList]), [wordList, foilList]);
  const [answers, setAnswers] = useState<RecognitionAnswers>({});

  const isComplete = words.every((word) => answers[word] !== undefined);

  function setAnswer(word: string, value: RecognitionAnswer) {
    setAnswers((prev) => ({ ...prev, [word]: value }));
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="font-serif text-2xl text-ink">Do you recognize these?</h1>
      <p className="mt-1 text-sm text-muted">Mark each word as in the original list or not.</p>
      <ul className="mt-4 flex flex-col gap-2">
        {words.map((word) => (
          <li
            key={word}
            className="flex items-center justify-between gap-3 rounded-md border border-hairline px-3 py-2"
          >
            <span className="text-ink">{word}</span>
            <div className="flex gap-2">
              <label className={optionClasses(answers[word] === "yes")}>
                <input
                  type="radio"
                  name={word}
                  value="yes"
                  checked={answers[word] === "yes"}
                  onChange={() => setAnswer(word, "yes")}
                  className="sr-only"
                />
                In list
              </label>
              <label className={optionClasses(answers[word] === "no")}>
                <input
                  type="radio"
                  name={word}
                  value="no"
                  checked={answers[word] === "no"}
                  onChange={() => setAnswer(word, "no")}
                  className="sr-only"
                />
                Not in list
              </label>
            </div>
          </li>
        ))}
      </ul>
      <Button onClick={() => onSubmit(answers)} disabled={!isComplete} className="mt-6 w-full">
        Submit
      </Button>
    </Card>
  );
}
