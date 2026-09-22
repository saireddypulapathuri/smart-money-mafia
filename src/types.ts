export type Persona =
  | "Smart Money"
  | "Exit Liquidity"
  | "Whale"
  | "Exchange Sink"
  | "Retail Swarm"
  | "Fresh Wallet";

export type AgentRole = "Gather" | "Movement" | "Brain" | "Judge" | "Risk";

export type ActorAgent = {
  role: AgentRole;
  name: string;
  status: "quiet" | "watching" | "warning" | "convicted";
  confidence: number;
  output: string;
};

export type RoundActor = {
  id: string;
  handle: string;
  persona: Persona;
  visibleRole: string;
  avatarGradient: string;
  walletCount: number;
  netFlowUsd: number;
  avgFlowUsd: number;
  confidence: number;
  clues: string[];
  agents: ActorAgent[];
  reveal: string;
};

export type RoundEvidence = {
  chain: string;
  tokenSymbol: string;
  tokenAddress: string;
  timeframe: string;
  marketMood: string;
  source: "mock" | "nansen" | "local";
  creditsNote: string;
  callsUsed: number;
  generatedAt: string;
  marketPulse?: MarketPulse;
};

export type MarketPulseRow = {
  chain: string;
  token_symbol: string;
  token_address: string;
  volume?: number;
  price_change?: number;
  market_cap_usd?: number;
  liquidity?: number;
  netflow?: number;
};

export type MarketPulse = {
  top_volume: MarketPulseRow[];
  top_gainers_7d: MarketPulseRow[];
  top_losers_7d: MarketPulseRow[];
};

export type GameRound = {
  id: string;
  title: string;
  prompt: string;
  targetPersona: Persona;
  evidence: RoundEvidence;
  actors: RoundActor[];
};

export type GuessResult = {
  selectedActor: RoundActor;
  isCorrect: boolean;
};
