"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const MIN_EXPOSURE_SECONDS = 15;

interface StudyPhaseProps {
  wordList: string[];
  onContinue: () => void;
}

export function StudyPhase({ wordList, onContinue }: StudyPhaseProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(MIN_EXPOSURE_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((seconds) => {
        if (seconds <= 1) {
          clearInterval(timer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isReady = secondsRemaining === 0;

  return (
    <Card className="w-full max-w-md">
      <h1 className="font-serif text-2xl text-ink">Study these words</h1>
      <p className="mt-1 text-sm text-muted">
        Try to remember all 10 — you will not be able to see this list again.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-2 text-ink">
        {wordList.map((word) => (
          <li
            key={word}
            className="rounded-md border border-hairline bg-background px-3 py-2 text-center"
          >
            {word}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-xs text-muted">
          {isReady ? "Ready when you are." : `Continue available in ${secondsRemaining}s`}
        </span>
        <Button onClick={onContinue} disabled={!isReady}>
          Continue
        </Button>
      </div>
    </Card>
  );
}
