#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "https://api.nansen.ai/api/v1";
const run = process.argv.includes("--run");

const apiKey = process.env.NANSEN_API_KEY;
const chain = process.env.NANSEN_CHAIN ?? "ethereum";
const fallbackToken = process.env.NANSEN_TOKEN_ADDRESS ?? "0x6982508145454ce325ddbe47a25d4ec3d2311933";
const tokenSymbol = process.env.NANSEN_TOKEN_SYMBOL ?? "PEPE";
const perPage = Number(process.env.NANSEN_WORKFLOW_PER_PAGE ?? 10);
const outputPath = resolve(rootDir, process.env.NANSEN_WORKFLOW_OUTPUT ?? "public/nansen-workflow/latest.json");

const now = new Date();
const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const window = {
  from: from.toISOString().replace(/\.\d{3}Z$/, "Z"),
  to: now.toISOString().replace(/\.\d{3}Z$/, "Z")
};

const requests = {
  netflow: {
    path: "/smart-money/netflow",
    body: {
      chains: [chain],
      filters: {
        include_native_tokens: false,
        include_stablecoins: false
      },
      order_by: [{ field: "net_flow_7d_usd", direction: "DESC" }],
      pagination: { page: 1, per_page: perPage }
    }
  },
  whoBoughtSold: {
    path: "/tgm/who-bought-sold",
    body: {
      chain,
      token_address: fallbackToken,
      date: window,
      pagination: { page: 1, per_page: perPage },
      order_by: [{ field: "trade_volume_usd", direction: "DESC" }]
    }
  },
  holders: {
    path: "/tgm/holders",
    body: {
      chain,
      token_address: fallbackToken,
      aggregate_by_entity: false,
      label_type: "all_holders",
      pagination: { page: 1, per_page: 100 },
      premium_labels: false,
      order_by: [{ field: "token_amount", direction: "DESC" }]
    }
  },
  price: {
    path: "/tgm/token-ohlcv",
    body: {
      chain,
      token_address: fallbackToken,
      timeframe: "1d",
      date: window
    }
  },
  topVolume: {
    path: "/token-screener",
    body: screenerBody("volume", "DESC")
  },
  topGainers: {
    path: "/token-screener",
    body: screenerBody("price_change", "DESC")
  },
  topLosers: {
    path: "/token-screener",
    body: screenerBody("price_change", "ASC")
  }
};

if (!run) {
  console.log("Dry run only. Add --run to spend Nansen credits and write the evidence pack.");
  console.log(JSON.stringify({ baseUrl, chain, tokenSymbol, fallbackToken, window, requests }, null, 2));
  process.exit(0);
}

if (!apiKey) {
  console.error("Missing NANSEN_API_KEY.");
  process.exit(1);
}

const netflow = await post(requests.netflow.path, requests.netflow.body);
const topToken = netflow.data?.[0];
const tokenAddress = process.env.NANSEN_TOKEN_ADDRESS ?? topToken?.token_address ?? fallbackToken;
const resolvedSymbol = process.env.NANSEN_TOKEN_SYMBOL ?? topToken?.token_symbol ?? tokenSymbol;

const tokenBody = { chain, token_address: tokenAddress };
const [whoBoughtSold, holders, price, topVolume, topGainers, topLosers] = await Promise.all([
  post(requests.whoBoughtSold.path, {
    ...requests.whoBoughtSold.body,
    ...tokenBody
  }),
  post(requests.holders.path, {
    ...requests.holders.body,
    ...tokenBody
  }),
  post(requests.price.path, {
    ...requests.price.body,
    ...tokenBody
  }),
  post(requests.topVolume.path, requests.topVolume.body),
  post(requests.topGainers.path, requests.topGainers.body),
  post(requests.topLosers.path, requests.topLosers.body)
]);

const evidencePack = {
  generated_at: new Date().toISOString(),
  chain,
  selected_token: {
    symbol: resolvedSymbol,
    address: tokenAddress,
    selection: process.env.NANSEN_TOKEN_ADDRESS ? "env_override" : "top_smart_money_netflow"
  },
  window,
  endpoints: {
    netflow: requests.netflow.path,
    who_bought_sold: requests.whoBoughtSold.path,
    holders: requests.holders.path,
    price: requests.price.path
    ,market_pulse: {
      top_volume: requests.topVolume.path,
      top_gainers_7d: requests.topGainers.path,
      top_losers_7d: requests.topLosers.path
    }
  },
  agent_handoff: summarizeForAgents(netflow, whoBoughtSold, holders, price, topVolume, topGainers, topLosers),
  raw: {
    netflow,
    who_bought_sold: whoBoughtSold,
    holders,
    price,
    market_pulse: {
      top_volume: topVolume,
      top_gainers_7d: topGainers,
      top_losers_7d: topLosers
    }
  }
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(evidencePack, null, 2)}\n`);
console.log(`Wrote Nansen evidence pack: ${outputPath}`);

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      apikey: apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed with ${response.status}: ${text.slice(0, 500)}`);
  }

  return response.json();
}

function screenerBody(field, direction) {
  return {
    chains: [chain],
    timeframe: "7d",
    filters: { include_stablecoins: false },
    order_by: [{ field, direction }],
    pagination: { page: 1, per_page: 10 }
  };
}

function summarizeForAgents(netflow, whoBoughtSold, holders, price, topVolume, topGainers, topLosers) {
  const topFlows = (netflow.data ?? []).slice(0, 5).map((row) => ({
    token_symbol: row.token_symbol,
    token_address: row.token_address,
    net_flow_7d_usd: row.net_flow_7d_usd,
    trader_count: row.trader_count,
    market_cap_usd: row.market_cap_usd
  }));

  const topTraders = (whoBoughtSold.data ?? []).slice(0, 5);
  const topHolders = (holders.data ?? []).slice(0, 10);
  const candles = price.data ?? [];
  const marketPulse = {
    top_volume: summarizeScreener(topVolume),
    top_gainers_7d: summarizeScreener(topGainers),
    top_losers_7d: summarizeScreener(topLosers)
  };

  return {
    gather: `Collected ${topFlows.length} Smart Money netflow candidates and ${topTraders.length} buyer/seller rows.`,
    movement: `Compared 7-day netflow, buyer/seller volume, top-holder concentration, and daily OHLCV for the selected token.`,
    brain: "Use netflow direction, trader breadth, holder concentration, and price response to create game suspects.",
    judge: "Prefer tokens where smart money movement and holder behavior disagree with price or crowd behavior.",
    risk: "Avoid over-weighting a single whale or holder row unless buyer/seller and OHLCV evidence confirms it.",
    market_pulse: marketPulse,
    top_flows: topFlows,
    top_holders_count: topHolders.length,
    candle_count: candles.length
  };
}

function summarizeScreener(response) {
  return (response.data ?? []).slice(0, 10).map((row) => ({
    chain: row.chain,
    token_symbol: row.token_symbol,
    token_address: row.token_address,
    volume: row.volume,
    price_change: row.price_change,
    market_cap_usd: row.market_cap_usd,
    liquidity: row.liquidity,
    netflow: row.netflow
  }));
}
