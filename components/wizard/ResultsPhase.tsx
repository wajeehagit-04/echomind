"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { computeFreeRecallStats, computeRecognitionStats } from "@/lib/scoring";
import type { CreateSessionRequest, SessionState } from "@/lib/types";

interface ResultsPhaseProps {
  session: SessionState;
  onTryAgain: () => void;
}

export function ResultsPhase({ session, onTryAgain }: ResultsPhaseProps) {
  const freeRecall = useMemo(
    () => computeFreeRecallStats(session.wordList, session.freeRecallWords),
    [session.wordList, session.freeRecallWords]
  );
  const recognition = useMemo(
    () => computeRecognitionStats(session.wordList, session.foilList, session.recognitionAnswers),
    [session.wordList, session.foilList, session.recognitionAnswers]
  );

  const [saveFailed, setSaveFailed] = useState(false);
  const hasPostedRef = useRef(false);

  useEffect(() => {
    // Guards against React Strict Mode's dev-only double-invoke of effects (mount, cleanup,
    // mount again) — without this, each completed session was POSTed twice.
    if (hasPostedRef.current) return;
    hasPostedRef.current = true;

    const body: CreateSessionRequest = {
      wordList: session.wordList,
      foilList: session.foilList,
      freeRecallWords: session.freeRecallWords,
      recognitionAnswers: session.recognitionAnswers,
    };

    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to save session: ${response.status}`);
      })
      .catch((error) => {
        console.error(error);
        setSaveFailed(true);
      });
  }, [session]);

  return (
    <Card className="w-full max-w-md">
      <h1 className="font-serif text-2xl text-ink">Results</h1>

      <section className="mt-4">
        <h2 className="font-serif text-lg text-ink">Free recall</h2>
        <div className="mt-2 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-serif text-2xl text-success">{freeRecall.hits.length}</p>
            <p className="text-xs text-muted">Hits</p>
          </div>
          <div>
            <p className="font-serif text-2xl text-danger">{freeRecall.misses.length}</p>
            <p className="text-xs text-muted">Misses</p>
          </div>
          <div>
            <p className="font-serif text-2xl text-danger">{freeRecall.intrusions.length}</p>
            <p className="text-xs text-muted">Intrusions</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {freeRecall.hits.map((word) => (
            <span
              key={`hit-${word}`}
              className="rounded-full border border-success px-2 py-0.5 text-xs text-success"
            >
              {word}
            </span>
          ))}
          {freeRecall.misses.map((word) => (
            <span
              key={`miss-${word}`}
              className="rounded-full border border-danger px-2 py-0.5 text-xs text-danger"
            >
              {word}
            </span>
          ))}
          {freeRecall.intrusions.map((word) => (
            <span
              key={`intrusion-${word}`}
              className="rounded-full border border-danger bg-danger px-2 py-0.5 text-xs text-background"
            >
              {word}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-lg text-ink">Recognition</h2>
        <div className="mt-2 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-serif text-2xl text-success">{recognition.hits}</p>
            <p className="text-xs text-muted">Hits</p>
          </div>
          <div>
            <p className="font-serif text-2xl text-danger">{recognition.falseAlarms}</p>
            <p className="text-xs text-muted">False alarms</p>
          </div>
          <div>
            <p className="font-serif text-2xl text-ink">{recognition.discriminationScore}</p>
            <p className="text-xs text-muted">Discrimination</p>
          </div>
        </div>
      </section>

      {saveFailed && (
        <p className="mt-4 text-xs text-danger">Couldn&apos;t save this session.</p>
      )}

      <div className="mt-6 flex gap-3">
        <Button onClick={onTryAgain} className="flex-1">
          Try again
        </Button>
        <Link
          href="/history"
          className="flex flex-1 items-center justify-center rounded-md border border-hairline bg-surface px-5 py-2.5 text-sm font-medium text-ink hover:border-accent/60"
        >
          View history
        </Link>
      </div>
    </Card>
  );
}
