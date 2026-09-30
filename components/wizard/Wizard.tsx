"use client";

import { useEffect, useReducer } from "react";
import { generateSession } from "@/lib/words";
import type { Phase, RecognitionAnswers, SessionState } from "@/lib/types";
import { StudyPhase } from "./StudyPhase";
import { DistractionPhase } from "./DistractionPhase";
import { RecallPhase } from "./RecallPhase";
import { RecognitionPhase } from "./RecognitionPhase";
import { ResultsPhase } from "./ResultsPhase";

const PHASE_ORDER: Phase[] = ["study", "distraction", "recall", "recognition", "results"];

function nextPhase(phase: Phase): Phase {
  const index = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER[Math.min(index + 1, PHASE_ORDER.length - 1)];
}

interface WizardState {
  phase: Phase | "loading";
  session: SessionState;
}

const emptySession: SessionState = {
  wordList: [],
  foilList: [],
  freeRecallWords: [],
  recognitionAnswers: {},
};

const initialState: WizardState = {
  phase: "loading",
  session: emptySession,
};

type WizardAction =
  | { type: "SESSION_READY"; wordList: string[]; foilList: string[] }
  | { type: "ADVANCE" }
  | { type: "SUBMIT_RECALL"; freeRecallWords: string[] }
  | { type: "SUBMIT_RECOGNITION"; recognitionAnswers: RecognitionAnswers }
  | { type: "RESET"; wordList: string[]; foilList: string[] };

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SESSION_READY":
      return {
        phase: "study",
        session: { ...emptySession, wordList: action.wordList, foilList: action.foilList },
      };
    case "ADVANCE":
      if (state.phase === "loading") return state;
      return { ...state, phase: nextPhase(state.phase) };
    case "SUBMIT_RECALL":
      if (state.phase !== "recall") return state;
      return {
        ...state,
        phase: nextPhase(state.phase),
        session: { ...state.session, freeRecallWords: action.freeRecallWords },
      };
    case "SUBMIT_RECOGNITION":
      if (state.phase !== "recognition") return state;
      return {
        ...state,
        phase: nextPhase(state.phase),
        session: { ...state.session, recognitionAnswers: action.recognitionAnswers },
      };
    case "RESET":
      return {
        phase: "study",
        session: { ...emptySession, wordList: action.wordList, foilList: action.foilList },
      };
    default:
      return state;
  }
}

export function Wizard() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Word lists are random per session, so they must never render during SSR (it would either
  // mismatch the client's first render or flash the wrong words). Generating them here, after
  // mount, means the server- and first-client-render are both this loading state.
  useEffect(() => {
    const { wordList, foilList } = generateSession();
    dispatch({ type: "SESSION_READY", wordList, foilList });
  }, []);

  function handleReset() {
    const { wordList, foilList } = generateSession();
    dispatch({ type: "RESET", wordList, foilList });
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div key={state.phase} className="phase-transition flex w-full flex-col items-center">
        {state.phase === "loading" && <p className="text-muted">Loading…</p>}
        {state.phase === "study" && (
          <StudyPhase
            wordList={state.session.wordList}
            onContinue={() => dispatch({ type: "ADVANCE" })}
          />
        )}
        {state.phase === "distraction" && (
          <DistractionPhase onComplete={() => dispatch({ type: "ADVANCE" })} />
        )}
        {state.phase === "recall" && (
          <RecallPhase
            onSubmit={(freeRecallWords) => dispatch({ type: "SUBMIT_RECALL", freeRecallWords })}
          />
        )}
        {state.phase === "recognition" && (
          <RecognitionPhase
            wordList={state.session.wordList}
            foilList={state.session.foilList}
            onSubmit={(recognitionAnswers) =>
              dispatch({ type: "SUBMIT_RECOGNITION", recognitionAnswers })
            }
          />
        )}
        {state.phase === "results" && (
          <ResultsPhase session={state.session} onTryAgain={handleReset} />
        )}
      </div>
    </main>
  );
}
