const SESSIONS_KEY = "shore-ledger-sessions-v1";
const META_KEY = "shore-ledger-meta-v1";

export type SessionEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  pocket: number;
  bank: number;
  bankedBeforeRisk: boolean;
  minutes: number;
  note: string;
  createdAt: string;
};

export type StorageFailReason = "unavailable" | "quota" | "unknown";

export type StorageWriteResult =
  | { ok: true }
  | { ok: false; reason: StorageFailReason };

export type StorageHealth = {
  available: boolean;
  lastError: StorageFailReason | null;
  lastSavedAt: string | null;
};

export type BackupPayload = {
  version: 1;
  exportedAt: string;
  app: "shore-ledger";
  sessions: SessionEntry[];
};

function canUseStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = "__shore_ledger_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function writeMeta(lastSavedAt: string): void {
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify({ lastSavedAt }));
  } catch {
    /* meta is best-effort */
  }
}

function readMeta(): { lastSavedAt: string | null } {
  if (!canUseStorage()) return { lastSavedAt: null };
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return { lastSavedAt: null };
    const parsed = JSON.parse(raw) as { lastSavedAt?: string };
    return {
      lastSavedAt:
        typeof parsed.lastSavedAt === "string" ? parsed.lastSavedAt : null,
    };
  } catch {
    return { lastSavedAt: null };
  }
}

export function getStorageHealth(
  lastError: StorageFailReason | null = null
): StorageHealth {
  return {
    available: canUseStorage(),
    lastError,
    lastSavedAt: readMeta().lastSavedAt,
  };
}

function normalizeSession(raw: unknown): SessionEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<SessionEntry>;
  if (typeof s.id !== "string" || typeof s.date !== "string") return null;
  const pocket = Number(s.pocket);
  const bank = Number(s.bank);
  if (!Number.isFinite(pocket) || !Number.isFinite(bank)) return null;
  const minutes = Number(s.minutes);
  return {
    id: s.id,
    date: s.date,
    pocket: Math.max(0, Math.round(pocket)),
    bank: Math.max(0, Math.round(bank)),
    bankedBeforeRisk: Boolean(s.bankedBeforeRisk),
    minutes: Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0,
    note: typeof s.note === "string" ? s.note.slice(0, 160) : "",
    createdAt:
      typeof s.createdAt === "string" ? s.createdAt : new Date().toISOString(),
  };
}

export function loadSessions(): SessionEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeSession)
      .filter((s): s is SessionEntry => s !== null);
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SessionEntry[]): StorageWriteResult {
  if (!canUseStorage()) return { ok: false, reason: "unavailable" };
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    writeMeta(new Date().toISOString());
    return { ok: true };
  } catch (error) {
    const quota =
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        error.code === 22);
    return { ok: false, reason: quota ? "quota" : "unknown" };
  }
}

export function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function habitScore(sessions: SessionEntry[]): number {
  if (sessions.length === 0) return 0;
  const banked = sessions.filter((s) => s.bankedBeforeRisk).length;
  return Math.round((banked / sessions.length) * 100);
}

export function bankShare(sessions: SessionEntry[]): number {
  const pocket = sessions.reduce((sum, s) => sum + Math.max(0, s.pocket), 0);
  const bank = sessions.reduce((sum, s) => sum + Math.max(0, s.bank), 0);
  const total = pocket + bank;
  if (total === 0) return 0;
  return Math.round((bank / total) * 100);
}

/** Consecutive calendar days (ending today or yesterday) with at least one log. */
export function currentStreak(sessions: SessionEntry[]): number {
  if (sessions.length === 0) return 0;
  const days = new Set(sessions.map((s) => s.date));
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  const key = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // If nothing logged today, allow streak to start from yesterday.
  if (!days.has(key(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(key(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(key(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Newest-first slice for habit sparkline (banked vs skipped). */
export function recentHabitSeries(
  sessions: SessionEntry[],
  limit = 14
): boolean[] {
  return [...sessions]
    .sort((a, b) => {
      if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
      return b.date.localeCompare(a.date);
    })
    .slice(0, limit)
    .reverse()
    .map((s) => s.bankedBeforeRisk);
}

export function exportBackup(sessions: SessionEntry[]): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: "shore-ledger",
    sessions,
  };
}

export function parseBackup(raw: string): BackupPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<BackupPayload>;
    if (parsed.version !== 1 || !Array.isArray(parsed.sessions)) return null;
    const sessions = parsed.sessions
      .map(normalizeSession)
      .filter((s): s is SessionEntry => s !== null);
    return {
      version: 1,
      exportedAt:
        typeof parsed.exportedAt === "string"
          ? parsed.exportedAt
          : new Date().toISOString(),
      app: "shore-ledger",
      sessions,
    };
  } catch {
    return null;
  }
}

export const SESSIONS_STORAGE_KEY = SESSIONS_KEY;
