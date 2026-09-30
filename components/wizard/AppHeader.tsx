export function AppHeader() {
  return (
    <header className="border-b border-hairline bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/echomind_wordmark.svg" alt="Echomind" className="h-24 w-auto shrink-0" />
        <p className="max-w-md text-xs leading-snug text-muted sm:text-right">
          Echomind is a demo modeled on a real clinical memory test structure (CERAD Word List Memory
          Test). It is not validated and is not a diagnostic tool.
        </p>
      </div>
    </header>
  );
}
