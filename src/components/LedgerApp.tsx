"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  SESSIONS_STORAGE_KEY,
  bankShare,
  createSessionId,
  currentStreak,
  exportBackup,
  getStorageHealth,
  habitScore,
  loadSessions,
  parseBackup,
  recentHabitSeries,
  saveSessions,
  todayISO,
  type SessionEntry,
  type StorageHealth,
} from "@/lib/storage";
import { ProPaywall } from "./ProPaywall";

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function tipForScore(score: number, count: number, streak: number): string {
  if (count === 0) {
    return "After you play, log pocket cash, bank balance, and whether you banked before a risky job. That builds your habit score.";
  }
  if (streak >= 3) {
    return `Nice ${streak}-day streak. Keep banking before high-risk runs — pocket stays for small spends.`;
  }
  if (score >= 75) {
    return "Strong bank-first habit. Keep moving cash before jobs that can wipe a session.";
  }
  if (score >= 40) {
    return "Mixed week. Try banking most cash before missions that can wipe a session.";
  }
  return "Habit tip: move cash to the bank before risky work. You enter the numbers — no game hooks.";
}

function storageMessage(health: StorageHealth): string | null {
  if (!health.available || health.lastError === "unavailable") {
    return "Local storage is blocked in this browser. Logs won’t save until storage is allowed.";
  }
  if (health.lastError === "quota") {
    return "This device is out of storage space. Delete old sessions or export a backup, then free space.";
  }
  if (health.lastError === "unknown") {
    return "Couldn’t save to this device. Try again or export a backup.";
  }
  return null;
}

export function LedgerApp() {
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [storageHealth, setStorageHealth] = useState<StorageHealth>({
    available: true,
    lastError: null,
    lastSavedAt: null,
  });
  const [paywall, setPaywall] = useState<"sync" | "export" | "profiles" | null>(
    null
  );
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>;
  } | null>(null);

  const [date, setDate] = useState("");
  const [pocket, setPocket] = useState("");
  const [bank, setBank] = useState("");
  const [minutes, setMinutes] = useState("");
  const [bankedBeforeRisk, setBankedBeforeRisk] = useState(true);
  const [note, setNote] = useState("");

  const formRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pocketRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      setSessions(loadSessions());
      setStorageHealth(getStorageHealth());
      setDate(todayISO());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(boot);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const result = saveSessions(sessions);
    const sync = window.setTimeout(() => {
      setStorageHealth(getStorageHealth(result.ok ? null : result.reason));
    }, 0);
    return () => window.clearTimeout(sync);
  }, [sessions, ready]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSIONS_STORAGE_KEY) return;
      setSessions(loadSessions());
      setStorageHealth(getStorageHealth());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
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

    const tip = window.setTimeout(() => {
      const ua = window.navigator.userAgent;
      const isIos = /iPad|iPhone|iPod/.test(ua);
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in window.navigator &&
          Boolean(
            (window.navigator as Navigator & { standalone?: boolean }).standalone
          ));
      if (isIos && !isStandalone) setShowIosTip(true);
    }, 0);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.clearTimeout(tip);
    };
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
  const habitBars = recentHabitSeries(sessions, 14);
  const totalPocket = sessions.reduce((s, x) => s + Math.max(0, x.pocket), 0);
  const totalBank = sessions.reduce((s, x) => s + Math.max(0, x.bank), 0);
  const bankedCount = sessions.filter((s) => s.bankedBeforeRisk).length;
  const storageNotice = storageMessage(storageHealth);
  const isEmpty = sessions.length === 0;

  function flash(message: string) {
    setToast(message);
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => pocketRef.current?.focus(), 350);
  }

  function resetForm() {
    setEditingId(null);
    setPocket("");
    setBank("");
    setMinutes("");
    setNote("");
    setBankedBeforeRisk(true);
    setFormError(null);
    setDate(todayISO());
  }

  async function installPwa() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setCanInstall(false);
    setDeferredPrompt(null);
  }

  function fillForm(entry: SessionEntry) {
    setEditingId(entry.id);
    setDate(entry.date);
    setPocket(String(entry.pocket));
    setBank(String(entry.bank));
    setMinutes(entry.minutes > 0 ? String(entry.minutes) : "");
    setBankedBeforeRisk(entry.bankedBeforeRisk);
    setNote(entry.note);
    setFormError(null);
    scrollToForm();
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

    if (editingId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                date,
                pocket: Math.round(pocketN),
                bank: Math.round(bankN),
                bankedBeforeRisk,
                minutes: Math.round(minutesN),
                note: note.trim().slice(0, 160),
              }
            : s
        )
      );
      resetForm();
      flash(
        bankedBeforeRisk
          ? "Session updated · banked-first habit counted"
          : "Session updated"
      );
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
    resetForm();
    flash(
      bankedBeforeRisk
        ? "Session saved · banked-first habit counted"
        : "Session saved — next time, try banking first"
    );
  }

  function deleteSession(id: string) {
    if (!confirm("Delete this session log?")) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) resetForm();
    flash("Session deleted");
  }

  function clearAll() {
    if (!confirm("Clear all session logs on this device?")) return;
    setSessions([]);
    resetForm();
    flash("All local logs cleared");
  }

  function downloadBackup() {
    const payload = exportBackup(sessions);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shore-ledger-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("JSON backup downloaded");
  }

  function onImportFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const backup = parseBackup(text);
      if (!backup) {
        flash("Backup file looked invalid");
        return;
      }
      if (
        sessions.length > 0 &&
        !confirm(
          `Replace ${sessions.length} local session${sessions.length === 1 ? "" : "s"} with ${backup.sessions.length} from backup?`
        )
      ) {
        return;
      }
      setSessions(backup.sessions);
      resetForm();
      flash(`Imported ${backup.sessions.length} session${backup.sessions.length === 1 ? "" : "s"}`);
    };
    reader.onerror = () => flash("Couldn’t read that backup file");
    reader.readAsText(file);
  }

  if (!ready) {
    return (
      <div
        className="mx-auto flex min-h-full w-full max-w-lg items-center justify-center px-4 py-20 text-sm text-[var(--muted)]"
        role="status"
        aria-live="polite"
      >
        Loading ledger…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 pb-14 pt-6 sm:px-6">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-40 w-[min(92vw,24rem)] -translate-x-1/2 rounded-xl border border-[var(--mint)]/30 bg-[var(--panel)] px-4 py-3 text-center text-sm text-[var(--foam)] shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      {storageNotice ? (
        <div
          role="alert"
          className="mb-4 rounded-2xl border border-[var(--sand)]/35 bg-[var(--sand)]/10 px-4 py-3 text-sm text-[var(--sand)]"
        >
          {storageNotice}
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
            <p className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--mint)]">
              Shore Ledger
            </p>
            <span className="rounded-md border border-[var(--line)] bg-black/25 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
              NeonGulf · local PWA
            </span>
          </div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[2.15rem] leading-[1.05] tracking-tight text-[var(--foam)]">
            {isEmpty ? "Log your first cash session" : "Your bank-first habit"}
          </h1>
          <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-[var(--muted)]">
            Pocket vs bank after each play session. Self-report only — no game
            hooks, no spoilers, not a story tracker.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2" aria-label="Habit summary">
            <div className="rounded-2xl border border-[var(--line)] bg-black/20 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Habit
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--foam)]">
                {score}%
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                {bankedCount}/{sessions.length || 0} banked first
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-black/20 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Streak
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--sand)]">
                {streak}
              </p>
              <p className="text-[11px] text-[var(--muted)]">
                day{streak === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-black/20 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Logs
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--foam)]">
                {sessions.length}
              </p>
              <p className="text-[11px] text-[var(--muted)]">sessions</p>
            </div>
          </div>

          {isEmpty ? (
            <button
              type="button"
              onClick={scrollToForm}
              className="mt-5 w-full rounded-xl bg-[var(--mint)] px-4 py-3.5 text-sm font-semibold text-[#041018] transition hover:brightness-110 active:scale-[0.99]"
            >
              Log first session
            </button>
          ) : (
            <button
              type="button"
              onClick={scrollToForm}
              className="mt-5 w-full rounded-xl border border-[var(--mint)]/40 bg-[var(--mint)]/10 px-4 py-3 text-sm font-semibold text-[var(--mint)] transition hover:bg-[var(--mint)]/15"
            >
              Log another session
            </button>
          )}

          {canInstall ? (
            <button
              type="button"
              onClick={installPwa}
              className="mt-3 w-full rounded-xl border border-[var(--line)] bg-black/20 px-3 py-2.5 text-sm font-medium text-[var(--foam)] transition hover:border-[var(--mint)]/35"
            >
              Install Shore Ledger on this device
            </button>
          ) : null}
          {showIosTip && !canInstall ? (
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--muted)]">
              On iPhone: Share → <span className="text-[var(--foam)]">Add to Home Screen</span>
            </p>
          ) : null}
        </div>
      </header>

      <section className="mt-5 animate-rise rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-4">
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          {tipForScore(score, sessions.length, streak)}
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

        {habitBars.length > 0 ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Recent bank-first habit</span>
              <span className="text-[11px]">
                <span className="text-[var(--mint)]">Mint</span> = banked ·{" "}
                <span className="text-[var(--sand)]">Sand</span> = skipped
              </span>
            </div>
            <div
              className="flex h-14 items-end gap-1"
              role="img"
              aria-label={`Last ${habitBars.length} sessions banked-first chart`}
            >
              {habitBars.map((banked, i) => (
                <div
                  key={`${i}-${banked}`}
                  className={`animate-bar min-w-0 flex-1 rounded-sm ${
                    banked ? "bg-[var(--mint)]" : "bg-[var(--sand)]/70"
                  }`}
                  style={{
                    height: banked ? "100%" : "42%",
                    animationDelay: `${i * 30}ms`,
                  }}
                  title={banked ? "Banked first" : "Skipped bank"}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel-2)] px-3 py-4 text-center text-xs text-[var(--muted)]">
            Your bank-first chart appears after the first log.
          </div>
        )}
      </section>

      <section
        id="log-session"
        ref={formRef}
        className="mt-5 animate-rise scroll-mt-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-5"
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--foam)]">
          {editingId ? "Edit session" : "Log a session"}
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
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-[var(--foam)] outline-none focus-visible:border-[var(--mint)]/50 focus-visible:ring-2 focus-visible:ring-[var(--mint)]/30"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-[var(--muted)]">Pocket cash</span>
              <input
                ref={pocketRef}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                required
                placeholder="0"
                value={pocket}
                onChange={(e) => setPocket(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-[var(--foam)] outline-none focus-visible:border-[var(--sand)]/50 focus-visible:ring-2 focus-visible:ring-[var(--sand)]/25"
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
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-[var(--foam)] outline-none focus-visible:border-[var(--mint)]/50 focus-visible:ring-2 focus-visible:ring-[var(--mint)]/30"
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
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-[var(--foam)] outline-none focus-visible:border-[var(--mint)]/50 focus-visible:ring-2 focus-visible:ring-[var(--mint)]/30"
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
              <span className="block text-[var(--foam)]">
                Banked before a risky job
              </span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                Check when you moved cash to the bank first. Builds your habit
                score.
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
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-[var(--foam)] outline-none focus-visible:border-[var(--mint)]/50 focus-visible:ring-2 focus-visible:ring-[var(--mint)]/30"
            />
          </label>
          {formError ? (
            <p
              className="rounded-xl border border-[var(--sand)]/30 bg-[var(--sand)]/10 px-3 py-2 text-sm text-[var(--sand)]"
              role="alert"
            >
              {formError}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--mint)] px-4 py-3 text-sm font-semibold text-[#041018] transition hover:brightness-110 active:scale-[0.99]"
            >
              {editingId ? "Update session" : "Save session"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => resetForm()}
                className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)] transition hover:text-[var(--foam)] sm:max-w-[9rem]"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mt-5" aria-label="Data tools">
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
          On this device
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadBackup}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foam)] transition hover:border-[var(--mint)]/40"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--foam)] transition hover:border-[var(--mint)]/40"
          >
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              onImportFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => setPaywall("sync")}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--mint)]/40 hover:text-[var(--foam)]"
          >
            Sync (Pro)
          </button>
          <button
            type="button"
            onClick={() => setPaywall("export")}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--mint)]/40 hover:text-[var(--foam)]"
          >
            CSV (Pro)
          </button>
          <button
            type="button"
            onClick={() => setPaywall("profiles")}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--mint)]/40 hover:text-[var(--foam)]"
          >
            Profiles (Pro)
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
        {storageHealth.lastSavedAt ? (
          <p className="mt-2 text-[11px] text-[var(--muted)]">
            Last saved locally{" "}
            {new Date(storageHealth.lastSavedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        ) : null}
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--foam)]">
              History
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Newest first · this device only
            </p>
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
            <button
              type="button"
              onClick={scrollToForm}
              className="mt-4 rounded-xl bg-[var(--mint)] px-4 py-2.5 text-sm font-semibold text-[#041018]"
            >
              Log first session
            </button>
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
                    <p className="text-sm font-medium text-[var(--foam)]">
                      {s.date}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Pocket {formatMoney(s.pocket)} · Bank{" "}
                      {formatMoney(s.bank)}
                      {s.minutes > 0 ? ` · ${s.minutes} min` : ""}
                    </p>
                    {s.note ? (
                      <p className="mt-1 text-xs text-[var(--foam)]/80">
                        {s.note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        s.bankedBeforeRisk
                          ? "bg-[var(--mint)]/15 text-[var(--mint)]"
                          : "bg-[var(--sand)]/15 text-[var(--sand)]"
                      }`}
                    >
                      {s.bankedBeforeRisk ? "Banked first" : "Skipped bank"}
                    </span>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => fillForm(s)}
                        className="text-[11px] text-[var(--mint)] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSession(s.id)}
                        className="text-[11px] text-[var(--muted)] hover:text-[var(--foam)]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 space-y-2 border-t border-[var(--line)] pt-6 text-center text-xs leading-relaxed text-[var(--muted)]">
        <p>
          <strong className="font-medium text-[var(--foam)]/80">Shore Ledger</strong>{" "}
          by{" "}
          <a
            href="https://neongulf.com"
            className="text-[var(--mint)] underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            NeonGulf
          </a>
          . Independent habit tool — not affiliated with Take-Two Interactive or
          Rockstar Games.
        </p>
        <p>
          Numbers you enter stay on this device unless you unlock Pro sync later.
          Soft link:{" "}
          <a
            href="https://gear.neongulf.com"
            className="text-[var(--mint)] underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            NeonGulf Gear
          </a>
          .
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
