<p align="center">
  <img src="public/og.png" alt="DAILYXP" width="600" />
</p>

<h3 align="center">life is more fun as a video game</h3>

<p align="center">
  Gamified daily routine tracker. Check off quests, earn XP, track weekly high scores, level up.
  <br />
  Zero backend. Zero accounts. Just you vs. yesterday.
</p>

<p align="center">
  <a href="https://dailyxp.app"><strong>dailyxp.app</strong></a>
</p>

---

## How it works

You define **quests** — the 5-10 things that dictate how well your day goes. Each quest earns points. Your job is to beat your weekly high score.

| Quest | Points |
|---|---|
| Sleep on time | +1 |
| Wake on time | +1 |
| Journal | +1 |
| Meditate | +1 |
| Stretch | +1 |
| 10K steps | +1 |
| Hit protein | +1 |
| Hit calories | +1 |
| Workout | +2 |

Quests are fully customizable — add, remove, or reweight from the Config tab.

## Features

- **XP ring** — daily progress visualized as a radial gauge
- **Weekly scoreboard** — bar chart of your current week, with high score tracking
- **Weekly history** — 8-week trend line so you can see the arc
- **Streak counter** — consecutive days with at least one quest completed
- **Level system** — NPC → Rookie → Grinder → Warrior → Elite → Legend → Mythic → God Mode
- **Perfect day** — golden flash when you hit 100%
- **New high score** — celebration toast when you beat your weekly best
- **Configurable quests** — add/remove/reweight anytime
- **Offline-first** — everything lives in localStorage, works without internet
- **PWA-ready** — add to home screen on iOS/Android

## Stack

- [React 19](https://react.dev) — single component, no router
- [Vite](https://vite.dev) — build tooling
- [Lucide](https://lucide.dev) — icons (1.5px stroke)
- [Vercel](https://vercel.com) — hosting
- **localStorage** — persistence (no database, no auth, no server)

Fonts: [Syne](https://fonts.google.com/specimen/Syne) (display), [Outfit](https://fonts.google.com/specimen/Outfit) (body), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (data).

## Run locally

```bash
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173).

## Deploy

```bash
npm run build
npx vercel --prod
```

Or connect the repo to Vercel — it auto-deploys on push.

## Inspiration

Based on [@seyong](https://x.com/seyong)'s [framework](https://x.com/seyong/status/2038990639782621347) for treating life like a video game:

> *there are ~5-10 things that dictate how well my day goes. i assign "points" to each of these things, for a total of 10 points each day. decision fatigue is real, and your brain is wired to make excuses that "make sense." i either do or i dont.*
>
> *my favorite part is tallying points up each week, and keeping track like a new high score to beat. i reassess where my holes are, and how i can do better.*
>
> *life is more fun as a video game.*

## License

[MIT](LICENSE)
