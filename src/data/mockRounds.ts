import type { GameRound } from "../types";
import { hydrateAgents } from "../services/agentEngine";

export const mockRounds: GameRound[] = [
  {
    id: "base-virtual",
    title: "The Base After-Hours Accumulation",
    prompt:
      "One actor is quietly accumulating while the rest of the room creates noise. Find the Smart Money.",
    targetPersona: "Smart Money",
    evidence: {
      chain: "Base",
      tokenSymbol: "VIRTUAL",
      tokenAddress: "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b",
      timeframe: "24h",
      marketMood: "A thin green candle, heavy exchange outflows, and five wallets moving in sync.",
      source: "mock",
      creditsNote: "Demo round. Live mode uses Nansen API flow intelligence.",
      callsUsed: 4,
      generatedAt: new Date().toISOString()
    },
    actors: [
      hydrateAgents({
        id: "actor-orchid",
        handle: "Orchid Desk",
        persona: "Smart Money",
        visibleRole: "Coordinated Accumulator",
        avatarGradient: "linear-gradient(135deg, #4ad7b8, #1d6f8f)",
        walletCount: 7,
        netFlowUsd: 482000,
        avgFlowUsd: 68857,
        confidence: 92,
        clues: [
          "Positive netflow across labeled smart trader wallets.",
          "Average flow is high, but wallet count stays compact.",
          "Activity appears after exchange withdrawals, not before deposits."
        ],
        reveal:
          "This cluster behaves like conviction accumulation: concentrated wallets, positive netflow, and little sell-side leakage."
      }),
      hydrateAgents({
        id: "actor-copper",
        handle: "Copper Exit",
        persona: "Exit Liquidity",
        visibleRole: "Distribution Cluster",
        avatarGradient: "linear-gradient(135deg, #f06b58, #8b263f)",
        walletCount: 19,
        netFlowUsd: -311000,
        avgFlowUsd: 16368,
        confidence: 79,
        clues: [
          "Repeated exchange deposits after local price strength.",
          "Flow direction is negative despite rising social chatter.",
          "Many wallets, but the average ticket size is weak."
        ],
        reveal:
          "This actor is selling into attention. It looks active, but the flow direction is the tell."
      }),
      hydrateAgents({
        id: "actor-vault",
        handle: "Vault Nine",
        persona: "Whale",
        visibleRole: "Single Large Holder",
        avatarGradient: "linear-gradient(135deg, #ffd166, #a45c16)",
        walletCount: 1,
        netFlowUsd: 265000,
        avgFlowUsd: 265000,
        confidence: 68,
        clues: [
          "One enormous wallet moved, but no supporting cluster joined.",
          "High dollar size, low breadth.",
          "Signal is powerful but isolated."
        ],
        reveal:
          "A whale can move a chart, but smart money confirmation needs breadth and timing."
      }),
      hydrateAgents({
        id: "actor-neon",
        handle: "Neon Queue",
        persona: "Retail Swarm",
        visibleRole: "Crowd Momentum",
        avatarGradient: "linear-gradient(135deg, #9b7cff, #3150a8)",
        walletCount: 84,
        netFlowUsd: 96000,
        avgFlowUsd: 1143,
        confidence: 61,
        clues: [
          "Wallet count is high, but average flow is tiny.",
          "Buying follows the candle instead of preceding it.",
          "No premium labels appear in the cluster."
        ],
        reveal:
          "Lots of footprints, little weight. This is crowd motion, not informed conviction."
      })
    ]
  },
  {
    id: "sol-jupiter",
    title: "Solana Midnight Rotation",
    prompt:
      "The token is pumping, but one actor is quietly feeding supply into the move. Find the Exit Liquidity.",
    targetPersona: "Exit Liquidity",
    evidence: {
      chain: "Solana",
      tokenSymbol: "JUP",
      tokenAddress: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
      timeframe: "7d",
      marketMood: "Fresh wallets chased the move while older wallets sent size toward liquid venues.",
      source: "mock",
      creditsNote: "Demo round. Live mode can compare smart trader, whale, fresh wallet, and exchange netflows.",
      callsUsed: 5,
      generatedAt: new Date().toISOString()
    },
    actors: [
      hydrateAgents({
        id: "actor-salt",
        handle: "Salt Lantern",
        persona: "Fresh Wallet",
        visibleRole: "New Wallet Wave",
        avatarGradient: "linear-gradient(135deg, #56cfe1, #4361ee)",
        walletCount: 53,
        netFlowUsd: 172000,
        avgFlowUsd: 3245,
        confidence: 72,
        clues: [
          "Fresh wallets are net positive over seven days.",
          "Entry size is small and spread across many addresses.",
          "This cluster joined late."
        ],
        reveal:
          "New wallets can confirm attention, but their timing often lags the informed move."
      }),
      hydrateAgents({
        id: "actor-ember",
        handle: "Ember Desk",
        persona: "Exit Liquidity",
        visibleRole: "Supply Distributor",
        avatarGradient: "linear-gradient(135deg, #ff8a5b, #ab2346)",
        walletCount: 11,
        netFlowUsd: -548000,
        avgFlowUsd: 49818,
        confidence: 88,
        clues: [
          "Negative whale and top-PnL flow while price holds up.",
          "Outflows cluster around high-volume windows.",
          "The selling is coordinated enough to matter."
        ],
        reveal:
          "The move looks healthy on price alone, but labeled capital is using the liquidity to exit."
      }),
      hydrateAgents({
        id: "actor-reef",
        handle: "Reef Vault",
        persona: "Smart Money",
        visibleRole: "Patient Holder",
        avatarGradient: "linear-gradient(135deg, #70e000, #168aad)",
        walletCount: 5,
        netFlowUsd: 74000,
        avgFlowUsd: 14800,
        confidence: 63,
        clues: [
          "Smart trader flow is positive but modest.",
          "The wallets are not adding aggressively.",
          "No strong follow-through after the first batch."
        ],
        reveal:
          "A supportive signal, but not the hidden force deciding this round."
      }),
      hydrateAgents({
        id: "actor-gate",
        handle: "Gate Current",
        persona: "Exchange Sink",
        visibleRole: "Venue Absorber",
        avatarGradient: "linear-gradient(135deg, #ced4da, #495057)",
        walletCount: 0,
        netFlowUsd: 392000,
        avgFlowUsd: 0,
        confidence: 70,
        clues: [
          "Exchange netflow is positive.",
          "The wallet count is unavailable for this segment.",
          "Venue movement confirms supply migration."
        ],
        reveal:
          "Exchanges are part of the story, but the labeled seller is the stronger deduction."
      })
    ]
  }
];
