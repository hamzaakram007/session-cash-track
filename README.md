# Shore Ledger

Session **cash / bank habit tracker** PWA under the NeonGulf brand.

**Brand:** Shore Ledger — independent fan utility.  
**Not affiliated** with Take-Two Interactive or Rockstar Games. No Rockstar assets, maps, or trademarks.

**Live:** https://cash.neongulf.com  
**Repo:** https://github.com/hamzaakram007/session-cash-track

## What it does

| Feature | Status |
| --- | --- |
| Log pocket cash + bank balance per session | ✅ Free · localStorage |
| “Banked before risky job” → habit % | ✅ Free |
| Day streak + pocket-vs-bank bar | ✅ Free |
| History list (edit/delete/clear) | ✅ Free |
| Installable PWA (manifest + SW) | ✅ |
| Cloud sync / CSV export / profiles | 🟨 Pro · checkout coming soon |

Self-report only — **no game hooks**, APIs, or spoilers.

## Free vs Pro

- **Free forever:** session logs, habit score, streak, history on this device.
- **Pro (coming soon):** cloud sync, CSV export, multiple profiles — planned at **$4.99 one-time**. Checkout isn’t live yet; nothing is charged today.

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

- Next.js App Router + TypeScript
- Tailwind CSS v4
- React client state + `localStorage`
- PWA: `public/manifest.webmanifest` + `public/sw.js`

## Deploy

Linked to Vercel team project `session-cash-track`. Pushing `main` triggers production.

## Legal / product notes

- Spoiler-free copy — money-habit journal, not a story tracker.
- Affiliate disclosure footer for future gear cross-links.
- Plug Lemon Squeezy / Stripe when ready to sell Pro.

## License

MIT — original Shore Ledger UI only.
