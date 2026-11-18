"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  bankShare,
  createSessionId,
  currentStreak,
  habitScore,
  loadSessions,
  saveSessions,
  todayISO,
  type SessionEntry,
} from "@/lib/storage";
import { ProPaywall } from "./ProPaywall";

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function tipForScore(score: number, count: number): string {
  if (count === 0) {
    return "Log your first session — pocket, bank, and whether you banked before a risky job.";
  }
  if (score >= 75) {
    return "Strong habit. Keep banking before high-risk runs; pocket stays for small spends.";
  }
  if (score >= 40) {
    return "Mixed week. Try banking most of your cash before missions that can wipe a session.";
  }
  return "Habit tip: move cash to the bank before risky work. You enter the numbers — no game hooks.";
}

export function LedgerApp() {
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [paywall, setPaywall] = useState<"sync" | "export" | "profiles" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>;
  } | null>(null);

  const [date, setDate] = useState("");
  const [pocket, setPocket] = useState("");
  const [bank, setBank] = useState("");
  const [minutes, setMinutes] = useState("");
  const [bankedBeforeRisk, setBankedBeforeRisk] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    setSessions(loadSessions());
    setDate(todayISO());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveSessions(sessions);
  }, [sessions, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      const ev = e as Event & { prompt: () => Promise<void> };
      setDeferredPrompt(ev);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const sorted = useMemo(
    () =>
      [...sessions].sort((a, b) => {
        if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
        return b.date.localeCompare(a.date);
      }),
    [sessions]
  );

  const score = habitScore(sessions);
  const share = bankShare(sessions);
  const streak = currentStreak(sessions);
  const totalPocket = sessions.reduce((s, x) => s + Math.max(0, x.pocket), 0);
  const totalBank = sessions.reduce((s, x) => s + Math.max(0, x.bank), 0);
  const bankedCount = sessions.filter((s) => s.bankedBeforeRisk).length;

  function flash(message: string) {
    setToast(message);
  }

  async function installPwa() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setCanInstall(false);
    setDeferredPrompt(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const pocketN = Number(pocket);
    const bankN = Number(bank);
    const minutesN = minutes.trim() === "" ? 0 : Number(minutes);
    if (!date) {
      setFormError("Pick a date for this session.");
      return;
    }
    if (!Number.isFinite(pocketN) || pocketN < 0) {
      setFormError("Enter pocket cash as 0 or higher.");
      return;
    }
    if (!Number.isFinite(bankN) || bankN < 0) {
      setFormError("Enter bank balance as 0 or higher.");
      return;
    }
    if (!Number.isFinite(minutesN) || minutesN < 0) {
      setFormError("Session minutes must be 0 or higher.");
      return;
    }

    const entry: SessionEntry = {
      id: createSessionId(),
      date,
      pocket: Math.round(pocketN),
      bank: Math.round(bankN),
      bankedBeforeRisk,
      minutes: Math.round(minutesN),
      note: note.trim().slice(0, 160),
      createdAt: new Date().toISOString(),
    };

    setSessions((prev) => [entry, ...prev]);
    setPocket("");
    setBank("");
    setMinutes("");
    setNote("");
    setBankedBeforeRisk(true);
    flash(bankedBeforeRisk ? "Session saved · banked-first habit counted" : "Session saved");
  }

  function deleteSession(id: string) {
    if (!confirm("Delete this session log?")) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    flash("Session deleted");
  }

  function clearAll() {
    if (!confirm("Clear all session logs on this device?")) return;
    setSessions([]);
    flash("All local logs cleared");
  }

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-lg items-center justify-center px-4 py-20 text-sm text-[var(--muted)]">
        Loading ledger…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 pb-14 pt-6 sm:px-6">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-40 w-[min(92vw,24rem)] -translate-x-1/2 rounded-xl border border-[var(--mint)]/30 bg-[var(--panel)] px-4 py-3 text-center text-sm text-[var(--foam)] shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      <header className="animate-glow relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)] px-5 py-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 85% 65% at 8% 0%, rgba(61,214,170,0.2), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(242,193,78,0.14), transparent 50%), linear-gradient(165deg, #071821 0%, #0a2c28 48%, #061018 100%)",
          }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--mint)]">
              Shore Ledger
            </p>
            <span className="rounded-full border border-[var(--line)] bg-black/25 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
              Local-first PWA
            </span>
          </div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[2.2rem] leading-[1.05] tracking-tight text-[var(--foam)]">
            Session cash habits
          </h1>
          <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-[var(--muted)]">
            Log pocket vs bank after each play session. Self-report only — no game hooks, no
            spoilers.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-[var(--line)] bg-black/20 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Habit</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--foam)]">
                {score}%
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                {bankedCount}/{sessions.length || 0} banked first
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-black/20 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Streak</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
                {streak}
              </p>
              <p className="text-[11px] text-[var(--muted)]">day{streak === 1 ? "" : "s"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-black/20 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Logs</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--foam)]">
                {sessions.length}
              </p>
              <p className="text-[11px] text-[var(--muted)]">sessions</p>
            </div>
          </div>

          {canInstall ? (
            <button
              type="button"
              onClick={installPwa}
              className="mt-4 w-full rounded-xl border border-[var(--mint)]/35 bg-[var(--mint)]/10 px-3 py-2.5 text-sm font-medium text-[var(--mint)] transition hover:bg-[var(--mint)]/15"
            >
              Install Shore Ledger on this device
            </button>
          ) : null}
        </div>
      </header>

      <section className="mt-5 animate-rise rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          {tipForScore(score, sessions.length)}
        </p>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Pocket vs bank (totals you entered)</span>
            <span className="text-[var(--foam)]">{share}% banked</span>
          </div>
          <div
            className="flex h-3 overflow-hidden rounded-full bg-[var(--panel-2)]"
            role="img"
            aria-label={`Bank share ${share} percent of logged totals`}
          >
            <div
              className="bg-[var(--sand)] transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - share)}%` }}
              title="Pocket"
            />
            <div
              className="bg-[var(--mint)] transition-all duration-500"
              style={{ width: `${share}%` }}
              title="Bank"
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-[var(--muted)]">
            <span>Pocket {formatMoney(totalPocket)}</span>
            <span>Bank {formatMoney(totalBank)}</span>
          </div>
        </div>
      </section>

      <section className="mt-5 animate-rise rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--foam)]">
          Log a session
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Enter numbers from your screen. We never read the game.
        </p>
        <form className="mt-4 space-y-3" onSubmit={onSubmit} noValidate>
          <label className="block text-sm">
            <span className="text-[var(--muted)]">Date</span>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-[var(--foam)] outline-none focus:border-[var(--mint)]/50"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Pocket cash</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                required
                placeholder="0"
                value={pocket}
                onChange={(e) => setPocket(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-[var(--foam)] outline-none focus:border-[var(--sand)]/50"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Bank balance</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                required
                placeholder="0"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-[var(--foam)] outline-none focus:border-[var(--mint)]/50"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-[var(--muted)]">Session minutes (optional)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              placeholder="45"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-[var(--foam)] outline-none focus:border-[var(--mint)]/50"
            />
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-3 text-sm transition hover:border-[var(--mint)]/25">
            <input
              type="checkbox"
              checked={bankedBeforeRisk}
              onChange={(e) => setBankedBeforeRisk(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--mint)]"
            />
            <span>
              <span className="block text-[var(--foam)]">Banked before a risky job</span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                Check when you moved cash to the bank first. Builds your habit score.
              </span>
            </span>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--muted)]">Note (optional, spoiler-free)</span>
            <input
              type="text"
              maxLength={160}
              placeholder="e.g. banked before night run"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-[var(--foam)] outline-none focus:border-[var(--mint)]/50"
            />
          </label>
          {formError ? (
            <p className="rounded-xl border border-[var(--sand)]/30 bg-[var(--sand)]/10 px-3 py-2 text-sm text-[var(--sand)]" role="alert">
              {formError}
            </p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--mint)] px-4 py-3 text-sm font-semibold text-[#041018] transition hover:brightness-110 active:scale-[0.99]"
          >
            Save session
          </button>
        </form>
      </section>

      <section className="mt-5">
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
          Pro features · stub only
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPaywall("sync")}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foam)] transition hover:border-[var(--mint)]/40"
          >
            Sync
          </button>
          <button
            type="button"
            onClick={() => setPaywall("export")}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foam)] transition hover:border-[var(--mint)]/40"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setPaywall("profiles")}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foam)] transition hover:border-[var(--mint)]/40"
          >
            Profiles
          </button>
          {sessions.length > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--muted)] transition hover:text-[var(--foam)]"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--foam)]">
              History
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Newest first · this device only</p>
          </div>
          {sessions.length > 0 ? (
            <p className="text-xs text-[var(--muted)]">{sessions.length} saved</p>
          ) : null}
        </div>
        {sorted.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--panel)] px-4 py-8 text-center">
            <p className="text-sm text-[var(--foam)]">No sessions yet</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              After you play, enter pocket + bank and tap Save session.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {sorted.map((s, i) => (
              <li
                key={s.id}
                className="animate-rise rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3"
                style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--foam)]">{s.date}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Pocket {formatMoney(s.pocket)} · Bank {formatMoney(s.bank)}
                      {s.minutes > 0 ? ` · ${s.minutes} min` : ""}
                    </p>
                    {s.note ? (
                      <p className="mt-1 text-xs text-[var(--foam)]/80">{s.note}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        s.bankedBeforeRisk
                          ? "bg-[var(--mint)]/15 text-[var(--mint)]"
                          : "bg-[var(--sand)]/15 text-[var(--sand)]"
                      }`}
                    >
                      {s.bankedBeforeRisk ? "Banked first" : "Skipped bank"}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteSession(s.id)}
                      className="text-[11px] text-[var(--muted)] hover:text-[var(--foam)]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 space-y-2 border-t border-[var(--line)] pt-6 text-center text-xs leading-relaxed text-[var(--muted)]">
        <p>
          <strong className="font-medium text-[var(--foam)]/80">Shore Ledger</strong> is an
          independent habit tool. Not affiliated with Take-Two Interactive or Rockstar Games.
        </p>
        <p>
          Affiliate disclosure: future soft links to headset / SSD gear hubs may earn a
          commission. Numbers you enter stay local unless you unlock Pro sync later.
        </p>
        <p>
          Soft link:{" "}
          <a
            href="https://console-gear-hub.vercel.app"
            className="text-[var(--mint)] underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Console Gear Hub
          </a>
        </p>
      </footer>

      <ProPaywall
        open={paywall !== null}
        feature={paywall ?? "sync"}
        onClose={() => setPaywall(null)}
      />
    </div>
  );
}
