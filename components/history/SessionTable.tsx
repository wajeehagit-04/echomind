import type { Session } from "@/db/schema";

interface SessionTableProps {
  sessions: Session[];
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function SessionTable({ sessions }: SessionTableProps) {
  if (sessions.length === 0) {
    return <p className="mt-6 text-sm text-muted">No sessions yet.</p>;
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-xs text-muted">
            <th className="py-2 pr-4 font-normal">Date</th>
            <th className="py-2 pr-4 font-normal">Recall hits</th>
            <th className="py-2 pr-4 font-normal">Recognition hits</th>
            <th className="py-2 pr-4 font-normal">False alarms</th>
            <th className="py-2 font-normal">Discrimination</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className="border-b border-hairline text-ink">
              <td className="py-2 pr-4">{formatDate(session.createdAt)}</td>
              <td className="py-2 pr-4">{session.freeRecallHits}</td>
              <td className="py-2 pr-4">{session.recognitionHits}</td>
              <td className="py-2 pr-4">{session.recognitionFalseAlarms}</td>
              <td className="py-2">{session.discriminationScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
