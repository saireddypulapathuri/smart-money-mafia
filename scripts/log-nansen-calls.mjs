#!/usr/bin/env node

const apiKey = process.env.NANSEN_API_KEY;
const run = process.argv.includes("--run");
const targetCalls = Number(process.env.NANSEN_CALL_TARGET ?? 1000);
const delayMs = Number(process.env.NANSEN_CALL_DELAY_MS ?? 800);

const chain = process.env.NANSEN_CHAIN ?? "base";
const tokenAddress =
  process.env.NANSEN_TOKEN_ADDRESS ?? "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b";
const timeframe = process.env.NANSEN_TIMEFRAME ?? "1d";

if (!run) {
  console.log("Dry run only. Add --run to make real Nansen API calls.");
  console.log(`Would call /api/v1/tgm/flow-intelligence ${targetCalls} times.`);
  process.exit(0);
}

if (!apiKey) {
  console.error("Missing NANSEN_API_KEY.");
  process.exit(1);
}

for (let index = 1; index <= targetCalls; index += 1) {
  const response = await fetch("https://api.nansen.ai/api/v1/tgm/flow-intelligence", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: apiKey
    },
    body: JSON.stringify({
      chain,
      token_address: tokenAddress,
      timeframe
    })
  });

  const requestId = response.headers.get("x-request-id") ?? "no-request-id";
  const creditsRemaining = response.headers.get("x-nansen-credits-remaining") ?? "unknown";

  if (!response.ok) {
    const text = await response.text();
    console.error(`#${index} failed: ${response.status} ${requestId}`);
    console.error(text.slice(0, 500));
    process.exit(1);
  }

  console.log(`#${index} ok request=${requestId} credits_remaining=${creditsRemaining}`);

  if (index < targetCalls) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
