# Shore Ledger

Session **cash / bank habit tracker** PWA (high-level MVP).

Brand: **Shore Ledger** — independent fan utility. Not affiliated with Take-Two Interactive or Rockstar Games. No Rockstar assets, maps, or trademarks.

## What this MVP does

- Mobile-friendly session log (Next.js + TypeScript + Tailwind)
- User-entered **pocket cash**, **bank balance**, optional minutes + note
- “Banked before risky job” checkbox → **habit score** + streak
- Simple pocket-vs-bank totals bar
- History list persisted in **localStorage**
- **Pro paywall stub** for sync / CSV export / profiles (no payment wired)
- Basic PWA: web manifest + service worker + installable icons

Self-report only — **no game hooks** or APIs.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build && npm start
```

## Stack

- Next.js App Router
- React client state + `localStorage`
- Tailwind CSS v4
- Offline-friendly SW (`public/sw.js`)

## Legal / product notes

- Spoiler-free copy only — this is a money-habit journal, not a story tracker.
- Affiliate disclosure footer included for future gear cross-links.
- Pro checkout is intentionally a stub; plug Lemon Squeezy / Stripe later.

## License

MIT — original Shore Ledger UI only.
