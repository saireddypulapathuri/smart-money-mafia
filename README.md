# Smart Money Mafia

Smart Money Mafia is a Nansen-powered social deduction game. Each round turns live holder-segment flow intelligence into a playable mystery: identify whether an actor is Smart Money, exit liquidity, a whale, an exchange sink, retail noise, or fresh-wallet momentum.

The goal is to make Nansen data drive the mechanic, not decorate a dashboard. A judge should understand the build in a silent 30-60 second recording.

## Agent Council

Every suspect runs a local, deterministic agent council so the game remains fully playable without depending on an external LLM or hosted inference service.

- **Gather** collects the raw segment signal.
- **Movement** maps inflow/outflow behavior and breadth.
- **Brain** converts flow behavior into intent.
- **Judge** produces the final behavioral explanation.
- **Risk** checks for weak evidence and false positives.

Nansen data feeds those agents. The app can use a saved local evidence vault for a stable recording or call Nansen live; it does not substitute fabricated market data.

## Why It Exists

Most onchain tools ask users to read tables. Smart Money Mafia asks users to make a decision.

The game loop is simple:

1. Pick a token/chain round.
2. Inspect suspect cards generated from onchain flow patterns.
3. Read clues derived from wallet segment behavior.
4. Lock a deduction.
5. Reveal the Nansen-backed identity and explanation.

## Nansen API Usage

Live mode currently targets:

- `POST /api/v1/tgm/flow-intelligence`

This endpoint provides net flows, average flows, and wallet counts for segments such as Smart Traders, Whales, Exchanges, Public Figures, Top PnL wallets, and Fresh Wallets. Those values become suspect stats, clues, confidence levels, and the round answer.

The daily evidence workflow also uses:

- `POST /api/v1/smart-money/netflow`
- `POST /api/v1/tgm/who-bought-sold`
- `POST /api/v1/tgm/holders`
- `POST /api/v1/tgm/token-ohlcv`
- `POST /api/v1/token-screener`

The Token Screener snapshot creates three useful market feeds: top traded volume, seven-day gainers, and seven-day losers. These are saved locally and shown as a market pulse so a user can choose which token deserves an investigation instead of manually searching tables.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Enable Live Nansen Mode

Copy the example env file:

```bash
cp .env.example .env.local
```

Set:

```bash
VITE_USE_NANSEN=true
VITE_NANSEN_API_KEY=your_key_here
```

Optional token settings:

```bash
VITE_NANSEN_CHAIN=base
VITE_NANSEN_TOKEN_SYMBOL=VIRTUAL
VITE_NANSEN_TOKEN_ADDRESS=0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b
VITE_NANSEN_TIMEFRAME=1d
```

If the live request fails, the app requires a valid local evidence vault instead of showing fabricated market data.

## Buildathon Submission Checklist

- Public GitHub repo
- 1,000+ Nansen API calls logged between Sep 14 and Sep 27
- 30-60 second screen recording
- X post tagging `@nansen_ai` with the GitHub link
- Entry form with email, X post URL, and GitHub repo

For the judging proof map, see [`SUBMISSION.md`](./SUBMISSION.md).

## Log The 1,000 Calls

The helper script is dry-run by default:

```bash
npm run nansen:calls
```

To make real calls:

```bash
NANSEN_API_KEY=your_key_here npm run nansen:calls -- --run
```

Optional controls:

```bash
NANSEN_CALL_TARGET=1000
NANSEN_CALL_DELAY_MS=800
NANSEN_CHAIN=base
NANSEN_TOKEN_ADDRESS=0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b
NANSEN_TIMEFRAME=1d
```

Run this only when you are ready to spend the credits and record qualifying usage.

## Generate A Daily Nansen Case

This workflow chains Smart Money discovery into Token God Mode evidence:

```bash
npm run nansen:workflow
```

That is a dry run. To make real API calls and write `public/nansen-workflow/latest.json`:

```bash
NANSEN_API_KEY=your_key_here npm run nansen:workflow -- --run
```

Defaults:

```bash
NANSEN_CHAIN=ethereum
NANSEN_TOKEN_ADDRESS=0x6982508145454ce325ddbe47a25d4ec3d2311933
NANSEN_TOKEN_SYMBOL=PEPE
```

If `NANSEN_TOKEN_ADDRESS` is omitted, the workflow uses the top token from Smart Money 7-day netflow. The evidence pack includes Smart Money netflow, who bought/sold, holder concentration, OHLCV, top volume, seven-day gainers, seven-day losers, and an `agent_handoff` summary for the game agents.

When `public/nansen-workflow/latest.json` exists, the app automatically uses it as the playable round. The submission includes a sanitized `public/nansen-workflow/demo.json` snapshot so a clean checkout can demonstrate the real Nansen data without an API key.

## Demo Recording Script

1. Open the game and show the Nansen evidence strip.
2. Select each suspect quickly to show clues.
3. Lock the deduction.
4. Reveal the identity and explanation.
5. Show the selected suspect's Agent Council.
6. Switch to live mode or show the `.env.example` Nansen configuration.
7. End on the README section explaining that Nansen flow intelligence powers the game mechanic.

## Competition Positioning

This is not a terminal, dashboard, token screener, or generic research agent. It is a game where Nansen data becomes the rules of play. The player learns how smart money, whales, fresh wallets, and exchanges behave by solving rounds generated from market data.
