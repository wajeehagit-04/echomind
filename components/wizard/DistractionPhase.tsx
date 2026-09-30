"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const TOTAL_ROUNDS = 5;

interface Problem {
  minuend: number;
  subtrahend: number;
}

function generateProblem(): Problem {
  return {
    minuend: 10 + Math.floor(Math.random() * 90), // two-digit: 10-99
    subtrahend: 1 + Math.floor(Math.random() * 9), // one-digit: 1-9
  };
}

interface DistractionPhaseProps {
  onComplete: () => void;
}

export function DistractionPhase({ onComplete }: DistractionPhaseProps) {
  const [problems] = useState<Problem[]>(() =>
    Array.from({ length: TOTAL_ROUNDS }, generateProblem)
  );
  const [roundIndex, setRoundIndex] = useState(0);
  const [answer, setAnswer] = useState("");

  const problem = problems[roundIndex];
  const isLastRound = roundIndex === TOTAL_ROUNDS - 1;

  function handleNext() {
    setAnswer("");
    if (isLastRound) {
      onComplete();
    } else {
      setRoundIndex((index) => index + 1);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="font-serif text-2xl text-ink">Quick math</h1>
      <p className="mt-1 text-sm text-muted">
        Round {roundIndex + 1} of {TOTAL_ROUNDS}
      </p>
      <p className="mt-6 text-center font-serif text-3xl text-ink">
        {problem.minuend} − {problem.subtrahend}
      </p>
      <input
        type="text"
        inputMode="numeric"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Your answer"
        className="mt-4 w-full rounded-md border border-hairline bg-background px-3 py-2 text-center text-ink placeholder:text-muted"
      />
      <Button onClick={handleNext} className="mt-6 w-full">
        {isLastRound ? "Continue" : "Next"}
      </Button>
    </Card>
  );
}
