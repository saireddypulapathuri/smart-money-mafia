import { hydrateAgents } from "./agentEngine";
import type { GameRound, MarketPulse, MarketPulseRow, Persona, RoundActor } from "../types";

type EvidencePack = {
  generated_at: string;
  chain: string;
  selected_token: {
    symbol: string;
    address: string;
    selection: string;
  };
  window: {
    from: string;
    to: string;
  };
  agent_handoff?: Record<string, unknown>;
  raw: {
    netflow?: { data?: Array<Record<string, unknown>> };
    who_bought_sold?: { data?: Array<Record<string, unknown>> };
    holders?: { data?: Array<Record<string, unknown>> };
    price?: { data?: Array<Record<string, unknown>> };
    market_pulse?: {
      top_volume?: { data?: Array<Record<string, unknown>> };
      top_gainers_7d?: { data?: Array<Record<string, unknown>> };
      top_losers_7d?: { data?: Array<Record<string, unknown>> };
    };
  };
};

export async function loadLocalEvidenceRound(): Promise<GameRound | null> {
  try {
    const response = await fetch("/nansen-workflow/latest.json", { cache: "no-store" });
    const fallbackResponse = response.ok ? response : await fetch("/nansen-workflow/demo.json", { cache: "no-store" });
    if (!fallbackResponse.ok) return null;
    const pack = (await fallbackResponse.json()) as EvidencePack;
    return createRoundFromEvidence(pack);
  } catch {
    return null;
  }
}

export function createScreenerRound(token: MarketPulseRow): GameRound {
  const flow = token.netflow ?? 0;
  const change = token.price_change ?? 0;
  const volume = token.volume ?? 0;
  const positive = flow >= 0;
  const confidence = Math.max(52, Math.min(94, Math.round(58 + Math.min(20, Math.abs(change) * 2) + (positive ? 8 : 0))));
  const actors: RoundActor[] = [
    hydrateAgents({
      id: `screener-flow-${token.token_address}`,
      handle: `${token.token_symbol} Flow Signal`,
      persona: positive ? "Smart Money" : "Exit Liquidity",
      visibleRole: "Screener Netflow",
      avatarGradient: "linear-gradient(135deg, #4ad7b8, #1d6f8f)",
      walletCount: 0,
      netFlowUsd: flow,
      avgFlowUsd: flow,
      confidence,
      clues: [`Nansen screener netflow is ${formatCurrency(flow)}.`, `The result is ranked from the 7d Token Screener snapshot.`, "Wallet-level attribution is not included in this screener case."],
      reveal: positive ? "The screener shows net positive flow, making accumulation the leading hypothesis." : "The screener shows net negative flow, making distribution the leading hypothesis."
    }),
    hydrateAgents({
      id: `screener-volume-${token.token_address}`,
      handle: `${token.token_symbol} Volume`,
      persona: "Whale",
      visibleRole: "Trading Intensity",
      avatarGradient: "linear-gradient(135deg, #ffd166, #a45c16)",
      walletCount: 0,
      netFlowUsd: volume,
      avgFlowUsd: volume,
      confidence: Math.max(50, Math.min(89, Math.round(55 + Math.log10(volume + 10) * 3))),
      clues: [`Observed 7d volume is ${formatCurrency(volume)}.`, `Volume ranks this token inside the saved Nansen market pulse.`, "High volume confirms attention, not intent by itself."],
      reveal: "This signal measures how much the market traded, not who controlled the trades."
    }),
    hydrateAgents({
      id: `screener-price-${token.token_address}`,
      handle: `${token.token_symbol} Momentum`,
      persona: change >= 0 ? "Retail Swarm" : "Exit Liquidity",
      visibleRole: "7D Price Response",
      avatarGradient: "linear-gradient(135deg, #9b7cff, #3150a8)",
      walletCount: 0,
      netFlowUsd: change * 1000,
      avgFlowUsd: change,
      confidence: Math.max(52, Math.min(90, Math.round(60 + Math.abs(change)))),
      clues: [`7d price change is ${change.toFixed(2)}%.`, "Price response is compared with netflow direction.", "Momentum can lag or front-run capital movement."],
      reveal: change >= 0 ? "Price momentum is positive, but the screener cannot prove who is buying." : "Price momentum is negative and deserves a risk-first review."
    }),
    hydrateAgents({
      id: `screener-liquidity-${token.token_address}`,
      handle: `${token.token_symbol} Liquidity`,
      persona: "Exchange Sink",
      visibleRole: "Market Depth",
      avatarGradient: "linear-gradient(135deg, #ced4da, #495057)",
      walletCount: 0,
      netFlowUsd: token.liquidity ?? 0,
      avgFlowUsd: token.market_cap_usd ?? 0,
      confidence: 58,
      clues: [`Reported liquidity is ${formatCurrency(token.liquidity ?? 0)}.`, `Market cap context is ${formatCurrency(token.market_cap_usd ?? 0)}.`, "Liquidity frames execution risk for the next investigation."],
      reveal: "Liquidity and market cap provide context, but they are not a wallet identity."
    })
  ];

  return {
    id: `screener-${token.chain}-${token.token_symbol}`,
    title: `${token.token_symbol} Nansen Screener Case`,
    prompt: `Use the real 7d Nansen screener metrics to identify what is driving ${token.token_symbol}.`,
    targetPersona: positive ? "Smart Money" : "Exit Liquidity",
    evidence: {
      chain: token.chain,
      tokenSymbol: token.token_symbol,
      tokenAddress: token.token_address,
      timeframe: "7d",
      marketMood: `${token.token_symbol} moved ${change.toFixed(2)}% with ${formatCurrency(volume)} observed volume and ${formatCurrency(flow)} netflow.`,
      source: "local",
      creditsNote: "Generated from the saved Nansen Token Screener response.",
      callsUsed: 1,
      generatedAt: new Date().toISOString()
    },
    actors
  };
}

function createRoundFromEvidence(pack: EvidencePack): GameRound {
  const netflow = pack.raw.netflow?.data?.[0] ?? {};
  const topBuyer = pack.raw.who_bought_sold?.data?.[0] ?? {};
  const topHolder = pack.raw.holders?.data?.[0] ?? {};
  const candles = pack.raw.price?.data ?? [];
  const firstCandle = candles[0] ?? {};
  const lastCandle = candles[candles.length - 1] ?? {};

  const netFlow7d = numberField(netflow, "net_flow_7d_usd");
  const traderCount = numberField(netflow, "trader_count");
  const marketCap = numberField(netflow, "market_cap_usd");
  const buyerVolume = numberField(topBuyer, "bought_volume_usd");
  const sellerVolume = numberField(topBuyer, "sold_volume_usd");
  const tradeVolume = numberField(topBuyer, "trade_volume_usd");
  const holderValue = numberField(topHolder, "value_usd");
  const holderOwnership = numberField(topHolder, "ownership_percentage");
  const holderBalanceChange = numberField(topHolder, "balance_change_30d");
  const open = numberField(firstCandle, "open");
  const close = numberField(lastCandle, "close");
  const holderBalanceChangeUsd = holderBalanceChange * close;
  const priceChange = open > 0 ? ((close - open) / open) * 100 : 0;
  const totalVolumeUsd = candles.reduce((sum, candle) => sum + numberField(candle, "volume_usd"), 0);

  const actors: RoundActor[] = [
    hydrateAgents({
      id: "real-smart-money-flow",
      handle: `${pack.selected_token.symbol} Flow Desk`,
      persona: "Smart Money",
      visibleRole: "7D Smart Money Netflow",
      avatarGradient: "linear-gradient(135deg, #4ad7b8, #1d6f8f)",
      walletCount: traderCount,
      netFlowUsd: netFlow7d,
      avgFlowUsd: traderCount ? netFlow7d / traderCount : netFlow7d,
      confidence: confidenceFrom(netFlow7d, traderCount, 92),
      clues: [
        `Smart Money 7D netflow is ${formatCurrency(netFlow7d)}.`,
        `${traderCount || "Unknown"} labeled traders contributed to the flow.`,
        marketCap > 0
          ? `Market cap context is ${formatCurrency(marketCap)}.`
          : "Market cap context was unavailable in the evidence pack."
      ],
      reveal:
        "This actor is generated from the Smart Money netflow endpoint: accumulation breadth plus positive flow makes it the cleanest informed-capital signal."
    }),
    hydrateAgents({
      id: "real-top-buyer",
      handle: String(topBuyer.address_label ?? "Top Buyer"),
      persona: buyerVolume >= sellerVolume ? "Fresh Wallet" : "Exit Liquidity",
      visibleRole: "Buyer/Seller Imbalance",
      avatarGradient: "linear-gradient(135deg, #56cfe1, #4361ee)",
      walletCount: 1,
      netFlowUsd: buyerVolume - sellerVolume,
      avgFlowUsd: tradeVolume,
      confidence: confidenceFrom(buyerVolume - sellerVolume, 1, 74),
      clues: [
        `Bought volume: ${formatCurrency(buyerVolume)}.`,
        `Sold volume: ${formatCurrency(sellerVolume)}.`,
        `Total trade imbalance: ${formatCurrency(buyerVolume - sellerVolume)}.`
      ],
      reveal:
        "This suspect comes from who-bought-sold data. It is strong color, but one address alone needs confirmation from broader flow."
    }),
    hydrateAgents({
      id: "real-top-holder",
      handle: String(topHolder.address_label ?? "Top Holder"),
      persona: "Whale",
      visibleRole: "Supply Concentration",
      avatarGradient: "linear-gradient(135deg, #ffd166, #a45c16)",
      walletCount: 1,
      netFlowUsd: holderBalanceChangeUsd,
      avgFlowUsd: holderValue,
      confidence: confidenceFrom(holderValue, 1, 70),
      clues: [
        `Top holder value is ${formatCurrency(holderValue)}.`,
        `Ownership share is ${(holderOwnership * 100).toFixed(2)}%.`,
        `30D balance change is ${formatTokenAmount(holderBalanceChange)} tokens.`
      ],
      reveal:
        "This suspect represents supply concentration. A giant holder changes the risk profile even when they are not the active smart-money buyer."
    }),
    hydrateAgents({
      id: "real-price-response",
      handle: "Price Tape",
      persona: priceChange >= 0 ? "Retail Swarm" : "Exit Liquidity",
      visibleRole: "OHLCV Response",
      avatarGradient: "linear-gradient(135deg, #9b7cff, #3150a8)",
      walletCount: candles.length,
      netFlowUsd: totalVolumeUsd,
      avgFlowUsd: candles.length ? totalVolumeUsd / candles.length : 0,
      confidence: Math.min(84, Math.max(52, Math.round(Math.abs(priceChange) * 8 + 52))),
      clues: [
        `Price changed ${priceChange.toFixed(2)}% across the evidence window.`,
        `${candles.length} daily candles were loaded.`,
        `Total observed OHLCV volume is ${formatCurrency(totalVolumeUsd)}.`
      ],
      reveal:
        "This suspect is price response, useful for spotting whether onchain conviction is already reflected in the market."
    })
  ];

  const targetPersona: Persona = netFlow7d >= 0 ? "Smart Money" : "Exit Liquidity";

  return {
    id: `local-${pack.chain}-${pack.selected_token.symbol}`,
    title: `${pack.selected_token.symbol} Real Nansen Case`,
    prompt: `This round was generated from a local Nansen evidence pack. Find the actor that best explains ${pack.selected_token.symbol}'s current setup.`,
    targetPersona,
    evidence: {
      chain: capitalize(pack.chain),
      tokenSymbol: pack.selected_token.symbol,
      tokenAddress: pack.selected_token.address,
      timeframe: "7d",
      marketMood: buildMood(netFlow7d, traderCount, priceChange, holderOwnership),
      source: "local",
      creditsNote: "Loaded from public/nansen-workflow/latest.json.",
      callsUsed: 4,
      generatedAt: pack.generated_at
      ,marketPulse: createMarketPulse(pack.raw.market_pulse)
    },
    actors
  };
}

function createMarketPulse(raw: EvidencePack["raw"]["market_pulse"]): MarketPulse | undefined {
  if (!raw) return undefined;
  return {
    top_volume: normalizePulseRows(raw.top_volume?.data),
    top_gainers_7d: normalizePulseRows(raw.top_gainers_7d?.data),
    top_losers_7d: normalizePulseRows(raw.top_losers_7d?.data)
  };
}

function normalizePulseRows(rows: Array<Record<string, unknown>> | undefined) {
  return (rows ?? []).map((row) => ({
    chain: String(row.chain ?? ""),
    token_symbol: String(row.token_symbol ?? "Unknown"),
    token_address: String(row.token_address ?? ""),
    volume: numberField(row, "volume"),
    price_change: numberField(row, "price_change"),
    market_cap_usd: numberField(row, "market_cap_usd"),
    liquidity: numberField(row, "liquidity"),
    netflow: numberField(row, "netflow")
  }));
}

function buildMood(netFlow7d: number, traderCount: number, priceChange: number, ownership: number): string {
  const flow = netFlow7d >= 0 ? "Smart Money accumulated" : "Smart Money distributed";
  const price = priceChange >= 0 ? "price followed upward" : "price faded during the window";
  return `${flow} ${formatCurrency(Math.abs(netFlow7d))} across ${traderCount || "unknown"} traders while ${price}; top-holder concentration sits near ${(ownership * 100).toFixed(2)}%.`;
}

function numberField(row: Record<string, unknown>, field: string): number {
  const value = row[field];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function confidenceFrom(valueUsd: number, count: number, base: number): number {
  const size = Math.min(16, Math.log10(Math.abs(valueUsd) + 10) * 2);
  const breadth = Math.min(12, Math.max(0, count) / 10);
  return Math.max(45, Math.min(96, Math.round(base + size + breadth - 12)));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatTokenAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    notation: "compact"
  }).format(value);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
