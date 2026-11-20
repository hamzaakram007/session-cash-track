"use client";

type ProPaywallProps = {
  open: boolean;
  feature: "sync" | "export" | "profiles";
  onClose: () => void;
};

const COPY = {
  sync: {
    title: "Cloud sync",
    body: "Keep Shore Ledger sessions on every device with Pro. Secure checkout isn’t available yet — you won’t be charged.",
  },
  export: {
    title: "CSV export",
    body: "Export a clean CSV of pocket vs bank for spreadsheets with Pro. Secure checkout isn’t available yet — you won’t be charged.",
  },
  profiles: {
    title: "Multiple profiles",
    body: "Add extra profiles for shared consoles with Pro. Secure checkout isn’t available yet — you won’t be charged.",
  },
} as const;

export function ProPaywall({ open, feature, onClose }: ProPaywallProps) {
  if (!open) return null;
  const copy = COPY[feature];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--line)] bg-[linear-gradient(135deg,#0a2230,#123528)] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--mint)]">
              Shore Ledger Pro
            </p>
            <span className="rounded-full border border-[var(--sand)]/40 bg-[var(--sand)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--sand)]">
              Coming soon
            </span>
          </div>
          <h2
            id="pro-title"
            className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--foam)]"
          >
            {copy.title}
          </h2>
        </div>
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm leading-relaxed text-[var(--muted)]">{copy.body}</p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-3">
              <p className="font-semibold text-[var(--foam)]">Free forever</p>
              <ul className="mt-2 space-y-1.5 text-[var(--muted)]">
                <li>Session logs</li>
                <li>Habit score + streak</li>
                <li>History on this device</li>
              </ul>
            </div>
            <div className="rounded-xl border border-[var(--mint)]/30 bg-[var(--mint)]/5 px-3 py-3">
              <p className="font-semibold text-[var(--mint)]">Pro</p>
              <ul className="mt-2 space-y-1.5 text-[var(--muted)]">
                <li>Cloud sync</li>
                <li>CSV export</li>
                <li>Multiple profiles</li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 text-center">
            <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--foam)]">
              $4.99
              <span className="ml-1 text-sm font-sans font-normal text-[var(--muted)]">
                one-time
              </span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Checkout isn’t live yet. You won’t be charged if you continue.
            </p>
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-[var(--mint)] px-4 py-3 text-sm font-semibold text-[#041018] transition hover:brightness-110"
            onClick={() =>
              alert(
                "Pro checkout isn’t available yet — you weren’t charged. Local session logs stay free."
              )
            }
          >
            Unlock Pro
          </button>
          <button
            type="button"
            className="w-full rounded-xl px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foam)]"
            onClick={onClose}
          >
            Keep free local mode
          </button>
        </div>
      </div>
    </div>
  );
}
