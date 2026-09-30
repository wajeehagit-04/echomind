"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface RecallPhaseProps {
  onSubmit: (words: string[]) => void;
}

function parseRecallInput(raw: string): string[] {
  return raw
    .split(/[,\n]+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 0);
}

export function RecallPhase({ onSubmit }: RecallPhaseProps) {
  const [value, setValue] = useState("");

  return (
    <Card className="w-full max-w-md">
      <h1 className="font-serif text-2xl text-ink">What do you remember?</h1>
      <p className="mt-1 text-sm text-muted">
        Type as many words as you recall, separated by commas or new lines.
      </p>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="butter, arm, shore..."
        className="mt-4 h-36 w-full rounded-md border border-hairline bg-background p-3 text-ink placeholder:text-muted"
      />
      <Button onClick={() => onSubmit(parseRecallInput(value))} className="mt-6 w-full">
        Submit
      </Button>
    </Card>
  );
}
