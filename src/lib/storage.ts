const SESSIONS_KEY = "shore-ledger-sessions-v1";

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

export function loadSessions(): SessionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s) =>
        s &&
        typeof s.id === "string" &&
        typeof s.date === "string" &&
        typeof s.pocket === "number" &&
        typeof s.bank === "number"
    );
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SessionEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
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
