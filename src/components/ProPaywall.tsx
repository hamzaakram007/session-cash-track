"use client";

type ProPaywallProps = {
  open: boolean;
  feature: "sync" | "export" | "profiles";
  onClose: () => void;
};

const COPY = {
  sync: {
    title: "Cloud sync",
    body: "Pro keeps Shore Ledger sessions on every device. Local logs stay free forever on this phone.",
  },
  export: {
    title: "Export CSV",
    body: "Pro unlocks a clean CSV of pocket vs bank so you can chart habits in a spreadsheet.",
  },
  profiles: {
    title: "Multiple profiles",
    body: "Pro adds extra profiles — handy if more than one person shares a console or save slot.",
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
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--mint)]">
            Shore Ledger Pro
          </p>
          <h2
            id="pro-title"
            className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--foam)]"
          >
            {copy.title}
          </h2>
        </div>
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm leading-relaxed text-[var(--muted)]">{copy.body}</p>
          <ul className="space-y-2 text-sm text-[var(--foam)]">
            <li className="flex gap-2">
              <span className="text-[var(--mint)]">✓</span> Cloud sync across devices
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--mint)]">✓</span> CSV export
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--mint)]">✓</span> Multiple profiles
            </li>
          </ul>
          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 text-center">
            <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--foam)]">
              $4.99
              <span className="ml-1 text-sm font-sans font-normal text-[var(--muted)]">
                one-time stub
              </span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Payment not wired yet — this is an MVP paywall placeholder.
            </p>
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-[var(--mint)] px-4 py-3 text-sm font-semibold text-[#041018] transition hover:brightness-110"
            onClick={() =>
              alert(
                "Pro checkout stub: connect Lemon Squeezy or Stripe here. Local session logs stay free."
              )
            }
          >
            Unlock Pro (stub)
          </button>
          <button
            type="button"
            className="w-full rounded-xl px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foam)]"
            onClick={onClose}
          >
            Keep using free local mode
          </button>
        </div>
      </div>
    </div>
  );
}
