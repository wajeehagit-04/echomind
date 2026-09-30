import { desc } from "drizzle-orm";
import { AppHeader } from "@/components/wizard/AppHeader";
import { SessionTable } from "@/components/history/SessionTable";
import { db } from "@/db/client";
import { sessions } from "@/db/schema";

// Sessions are inserted continuously; without this the page would be eligible for static
// prerendering at build time and would freeze on whatever rows existed then.
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const rows = await db.select().from(sessions).orderBy(desc(sessions.createdAt));

  return (
    <>
      <AppHeader />
      <main className="flex flex-1 flex-col items-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <h1 className="font-serif text-2xl text-ink">Session history</h1>
          <SessionTable sessions={rows} />
        </div>
      </main>
    </>
  );
}
