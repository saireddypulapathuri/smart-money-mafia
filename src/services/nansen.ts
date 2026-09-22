import { hydrateAgents } from "./agentEngine";
import { loadLocalEvidenceRound } from "./localEvidence";
import type { GameRound, RoundActor } from "../types";

const NANSEN_BASE_URL = "https://api.nansen.ai";

type FlowIntelligenceResponse = {
  data?: Array<Record<string, number | null>>;
};

const personaOrder = [
  "Smart Money",
  "Whale",
  "Exchange Sink",
  "Fresh Wallet"
] as const;

const gradients = [
  "linear-gradient(135deg, #4ad7b8, #1d6f8f)",
  "linear-gradient(135deg, #ffd166, #a45c16)",
  "linear-gradient(135deg, #ced4da, #495057)",
  "linear-gradient(135deg, #56cfe1, #4361ee)"
];

export async function loadRound(roundIndex: number): Promise<GameRound> {
  const localRound = await loadLocalEvidenceRound();
  if (localRound) return localRound;

  const apiKey = import.meta.env.VITE_NANSEN_API_KEY as string | undefined;
  const useLive = import.meta.env.VITE_USE_NANSEN === "true" && Boolean(apiKey);

  if (!useLive) throw new Error("No local Nansen evidence pack found. Run the guided workflow first.");

  try {
    return await loadLiveRound(apiKey as string);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Nansen live request failed.");
  }
}

async function loadLiveRound(apiKey: string): Promise<GameRound> {
  const tokenAddress =
    (import.meta.env.VITE_NANSEN_TOKEN_ADDRESS as string | undefined) ??
    "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b";
  const chain = (import.meta.env.VITE_NANSEN_CHAIN as string | undefined) ?? "base";
  const tokenSymbol = (import.meta.env.VITE_NANSEN_TOKEN_SYMBOL as string | undefined) ?? "VIRTUAL";
  const timeframe = (import.meta.env.VITE_NANSEN_TIMEFRAME as string | undefined) ?? "1d";

  const response = await fetch(`${NANSEN_BASE_URL}/api/v1/tgm/flow-intelligence`, {
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

  if (!response.ok) {
    throw new Error(`Nansen API returned ${response.status}`);
  }

  const payload = (await response.json()) as FlowIntelligenceResponse;
  const flow = payload.data?.[0];

  if (!flow) {
    throw new Error("Nansen flow intelligence response had no data");
  }

  const actors: RoundActor[] = personaOrder.map((persona, index) => {
    const prefix =
      persona === "Smart Money"
        ? "smart_trader"
        : persona === "Whale"
          ? "whale"
          : persona === "Exchange Sink"
            ? "exchange"
            : "fresh_wallets";

    const netFlowUsd = Number(flow[`${prefix}_net_flow_usd`] ?? 0);
    const avgFlowUsd = Number(flow[`${prefix}_avg_flow_usd`] ?? 0);
    const walletCount = Number(flow[`${prefix}_wallet_count`] ?? 0);
    const positive = netFlowUsd >= 0;

    return hydrateAgents({
      id: `live-${prefix}`,
      handle: persona === "Smart Money" ? "Labeled Alpha" : persona,
      persona,
      visibleRole:
        persona === "Smart Money"
          ? "Labeled Trader Flow"
          : persona === "Exchange Sink"
            ? "Venue Flow"
            : `${persona} Flow`,
      avatarGradient: gradients[index],
      walletCount,
      netFlowUsd,
      avgFlowUsd,
      confidence: Math.min(96, Math.max(45, Math.round(Math.log10(Math.abs(netFlowUsd) + 10) * 18))),
      clues: [
        `${positive ? "Positive" : "Negative"} netflow: ${formatCurrency(netFlowUsd)}.`,
        walletCount > 0
          ? `${walletCount} wallets are visible in this segment.`
          : "Wallet count is unavailable or not tracked for this segment.",
        `Average absolute flow is ${formatCurrency(avgFlowUsd)}.`
      ],
      reveal: positive
        ? `${persona} is adding net exposure over this window.`
        : `${persona} is reducing net exposure over this window.`
    });
  });

  const targetActor = actors.reduce((best, actor) =>
    actor.persona === "Smart Money" || actor.netFlowUsd > best.netFlowUsd ? actor : best
  );

  return {
    id: `live-${chain}-${tokenSymbol}`,
    title: `${capitalize(chain)} Live Deduction`,
    prompt: `Nansen live flow intelligence is moving through ${tokenSymbol}. Find the strongest accumulation signal.`,
    targetPersona: targetActor.persona,
    evidence: {
      chain: capitalize(chain),
      tokenSymbol,
      tokenAddress,
      timeframe,
      marketMood: "Live holder-segment flows are powering this round.",
      source: "nansen",
      creditsNote: "Powered by /api/v1/tgm/flow-intelligence.",
      callsUsed: 1,
      generatedAt: new Date().toISOString()
    },
    actors
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
