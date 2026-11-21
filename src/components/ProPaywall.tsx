"use client";

import { useEffect, useId, useRef } from "react";

type ProPaywallProps = {
  open: boolean;
  feature: "sync" | "export" | "profiles";
  onClose: () => void;
};

const COPY = {
  sync: {
    title: "Cloud sync (coming soon)",
    body: "Pro will keep Shore Ledger sessions on every device. Nothing is charged today — local logs stay on this phone until Pro ships.",
  },
  export: {
    title: "CSV export (coming soon)",
    body: "Pro will unlock spreadsheet CSV of pocket vs bank. Free JSON backup stays available now — no payment request today.",
  },
  profiles: {
    title: "Multiple profiles (coming soon)",
    body: "Pro will add extra profiles for shared consoles. Free local mode on this device stays available.",
  },
} as const;

export function ProPaywall({ open, feature, onClose }: ProPaywallProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  const copy = COPY[feature];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
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
            <span className="rounded-md border border-[var(--sand)]/40 bg-[var(--sand)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--sand)]">
              Stub · not charged
            </span>
          </div>
          <h2
            id={titleId}
            className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--foam)]"
          >
            {copy.title}
          </h2>
        </div>
        <div className="space-y-4 px-5 py-5">
          <p className="rounded-xl border border-[var(--sand)]/25 bg-[var(--sand)]/8 px-3 py-2 text-xs leading-relaxed text-[var(--sand)]">
            Checkout is not live. Free local habit logs stay on this device — you
            will not be charged if you continue.
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">{copy.body}</p>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Free now
            </p>
            <ul className="mt-2 space-y-2 text-sm text-[var(--foam)]">
              <li className="flex gap-2">
                <span className="text-[var(--mint)]" aria-hidden>
                  ✓
                </span>
                Session logs + habit score + streak
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--mint)]" aria-hidden>
                  ✓
                </span>
                History + free JSON backup on this device
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Planned Pro
            </p>
            <ul className="mt-2 space-y-2 text-sm text-[var(--foam)]">
              <li className="flex gap-2">
                <span className="text-[var(--muted)]" aria-hidden>
                  ○
                </span>
                Cloud sync across devices
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--muted)]" aria-hidden>
                  ○
                </span>
                CSV export
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--muted)]" aria-hidden>
                  ○
                </span>
                Multiple profiles
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 text-center">
            <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--foam)]">
              $4.99
              <span className="ml-1 text-sm font-sans font-normal text-[var(--muted)]">
                planned one-time
              </span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Planned price. Unlock opens a notice for now — no card form.
            </p>
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-[var(--mint)] px-4 py-3 text-sm font-semibold text-[#041018] transition hover:brightness-110"
            onClick={() =>
              alert(
                "Pro unlocks soon.\n\nNo payment was taken. Free local session logs stay on this device."
              )
            }
          >
            Unlock Pro — coming soon
          </button>
          <button
            ref={closeRef}
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
