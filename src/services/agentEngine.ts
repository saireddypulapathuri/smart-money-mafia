import type { ActorAgent, Persona, RoundActor } from "../types";

const personaIntent: Record<Persona, string> = {
  "Smart Money": "conviction accumulation",
  "Exit Liquidity": "distribution into attention",
  Whale: "single-holder force",
  "Exchange Sink": "venue migration",
  "Retail Swarm": "crowd momentum",
  "Fresh Wallet": "new-wallet attention"
};

export function createActorAgents(actor: Omit<RoundActor, "agents">): ActorAgent[] {
  const direction = actor.netFlowUsd >= 0 ? "inflow" : "outflow";
  const breadth =
    actor.walletCount === 0 ? "untracked breadth" : actor.walletCount < 6 ? "narrow breadth" : "wide breadth";
  const size =
    Math.abs(actor.netFlowUsd) > 400000
      ? "large"
      : Math.abs(actor.netFlowUsd) > 150000
        ? "meaningful"
        : "modest";
  const avgVsNet = Math.abs(actor.avgFlowUsd) > Math.abs(actor.netFlowUsd) / 3 ? "concentrated" : "distributed";
  const status = statusFromActor(actor);

  return [
    {
      role: "Gather",
      name: "Signal Gatherer",
      status,
      confidence: clamp(actor.confidence - 6),
      output: `Collected ${size} ${direction} with ${breadth}.`
    },
    {
      role: "Movement",
      name: "Flow Cartographer",
      status: actor.netFlowUsd < 0 ? "warning" : status,
      confidence: clamp(actor.confidence - 2),
      output: `Movement reads as ${avgVsNet} ${direction} across the segment.`
    },
    {
      role: "Brain",
      name: "Intent Model",
      status,
      confidence: actor.confidence,
      output: `Best behavioral fit: ${personaIntent[actor.persona]}.`
    },
    {
      role: "Judge",
      name: "Deduction Judge",
      status: actor.confidence >= 82 ? "convicted" : status,
      confidence: clamp(actor.confidence + 3),
      output: actor.reveal
    },
    {
      role: "Risk",
      name: "False-Positive Guard",
      status: actor.walletCount <= 1 || actor.confidence < 70 ? "warning" : "watching",
      confidence: clamp(100 - actor.confidence + 48),
      output:
        actor.walletCount <= 1
          ? "Risk: one wallet can look important without cohort confirmation."
          : "Risk check passed: signal has enough supporting structure for gameplay."
    }
  ];
}

export function hydrateAgents<T extends Omit<RoundActor, "agents">>(actor: T): T & { agents: ActorAgent[] } {
  return {
    ...actor,
    agents: createActorAgents(actor)
  };
}

function statusFromActor(actor: Omit<RoundActor, "agents">): ActorAgent["status"] {
  if (actor.confidence >= 85) return "convicted";
  if (actor.netFlowUsd < 0) return "warning";
  if (actor.confidence >= 70) return "watching";
  return "quiet";
}

function clamp(value: number): number {
  return Math.max(1, Math.min(99, Math.round(value)));
}
