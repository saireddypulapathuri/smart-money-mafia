# Smart Money Mafia Submission Plan

This file maps the build directly to the Nansen Meridian Buildathon judging criteria.

## 1. Data Integration - 25%

Nansen data drives the playable logic, not just the display.

- Smart Money netflow selects the real token case and creates the Smart Money suspect.
- Who Bought/Sold data creates the buyer/seller imbalance suspect.
- Holders data creates the supply concentration suspect.
- OHLCV data creates the price response suspect.
- The local agent council uses these values to generate clues, intent, confidence, risk, and verdict explanations.

Evidence in code:

- `scripts/nansen-guided-workflow.mjs`
- `src/services/localEvidence.ts`
- `src/services/agentEngine.ts`

## 2. Creativity & Originality - 25%

This is a social deduction game powered by Nansen data. It is intentionally not another dashboard, scanner, terminal, report generator, or generic AI analyst.

Core hook:

> Can you identify Smart Money behavior before the market does?

The user learns onchain intelligence by playing a mystery round.

## 3. Functionality & Workability - 25%

The demo is designed not to break during recording.

- First round loads from `public/nansen-workflow/latest.json`.
- Live API mode is supported with `VITE_USE_NANSEN=true`.
- A committed Nansen evidence snapshot keeps the recording deterministic without exposing an API key.
- `npm run build` passes.
- `npm run nansen:workflow` is dry-run by default.
- `npm run nansen:calls` is dry-run by default.

## 4. Documentation & Submission - 25%

README covers:

- Setup under 10 minutes
- Live Nansen mode
- Daily case generation
- 1,000-call helper
- Demo recording script
- Competition positioning

## 30-60 Second Recording

1. Open Home and show the Nansen dashboard metrics.
2. Search `PEPE`, select Ethereum, and click `Play PEPE investigation`.
3. Show the real volume, 7D gainers, and 7D losers market pulse.
4. Click PEPE Flow Desk and show clues plus all five agents.
5. Lock the deduction and reveal the verdict.
6. Open Data Vault to show the saved Nansen snapshot metadata.
7. End on README setup and submission checklist.

No narration needed: the UI labels and reveal text should carry the story.
