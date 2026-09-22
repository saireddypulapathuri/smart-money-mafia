import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Brain,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Crosshair,
  Eye,
  Fingerprint,
  Flame,
  Gauge,
  Radar,
  RefreshCw,
  ShieldQuestion,
  Sparkles,
  Trophy,
  WalletCards,
  Home,
  Settings,
  Table2,
  UsersRound
} from "lucide-react";
import { loadRound } from "./services/nansen";
import { createScreenerRound } from "./services/localEvidence";
import type { GameRound, GuessResult, MarketPulseRow, Persona, RoundActor } from "./types";

const personaIcons: Record<Persona, string> = {
  "Smart Money": "SM",
  "Exit Liquidity": "XL",
  Whale: "WH",
  "Exchange Sink": "EX",
  "Retail Swarm": "RS",
  "Fresh Wallet": "FW"
};

export function App() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState<GameRound | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [score, setScore] = useState({ wins: 0, played: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objective, setObjective] = useState<ResearchObjective>("opportunity");
  const [selectedMarketToken, setSelectedMarketToken] = useState<MarketPulseRow | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    loadRound(roundIndex)
      .then((nextRound) => {
        if (!mounted) return;
        setRound(nextRound);
        setSelectedId(null);
        setResult(null);
        setObjective("opportunity");
        setSelectedMarketToken(null);
      })
      .catch((loadError: unknown) => {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "Nansen evidence is unavailable.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [roundIndex]);

  const selectedActor = useMemo(
    () => round?.actors.find((actor) => actor.id === selectedId) ?? null,
    [round, selectedId]
  );

  function submitGuess() {
    if (!round || !selectedActor || result) return;
    const isCorrect = selectedActor.persona === round.targetPersona;
    setResult({ selectedActor, isCorrect });
    setScore((current) => ({
      wins: current.wins + (isCorrect ? 1 : 0),
      played: current.played + 1
    }));
  }

  function nextRound() {
    setRoundIndex((index) => index + 1);
  }

  function playSelectedToken(token: MarketPulseRow) {
    const nextRound = token.token_symbol.toUpperCase() === round?.evidence.tokenSymbol.toUpperCase()
      ? round
      : createScreenerRound(token);
    setRound(nextRound);
    setSelectedId(null);
    setResult(null);
    document.querySelector(".suspectGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <main className="app loading">
        <div className="loader">
          <Sparkles size={28} />
          <span>Dealing onchain suspects...</span>
        </div>
      </main>
    );
  }

  if (error || !round) {
    return <DataRequiredState message={error ?? "No saved Nansen evidence was found."} />;
  }

  const correctActor = round.actors.find((actor) => actor.persona === round.targetPersona);

  return (
    <main className="app">
      <section className="hero">
        <div className="heroBackdrop" />
        <nav className="topbar" aria-label="Game status">
          <div className="brandMark">
            <Fingerprint size={20} />
            <span>Smart Money Mafia</span>
          </div>
          <div className="scorePill">
            <Trophy size={17} />
            <span>
              {score.wins}/{score.played || 0}
            </span>
          </div>
        </nav>
        <WorkspaceNav />

        <div className="heroGrid">
          <div className="intro">
            <p className="eyebrow">Nansen API Deduction Game</p>
            <h1>Spot the wallet behavior before the market does.</h1>
            <p className="subtitle">
              Each suspect runs a local agent council: gather signals, map movements, model
              intent, judge the behavior, and guard against false positives.
            </p>
          </div>

          <div className="caseFile" aria-label="Current case">
            <div className="caseHeader">
              <ShieldQuestion size={24} />
              <div>
                <span>Current Case</span>
                <strong>{round.title}</strong>
              </div>
            </div>
            <p>{round.prompt}</p>
            <EvidenceStrip round={round} />
          </div>
        </div>
      </section>

      <section className="gameShell" id="home">
        <DashboardHome round={round} onSelectToken={setSelectedMarketToken} />
        <TokenSelector round={round} selectedToken={selectedMarketToken} onSelect={setSelectedMarketToken} onPlay={playSelectedToken} />
        <SignalVisualization round={round} />
        <div className="briefing">
          <div>
            <p className="sectionLabel">Market Mood</p>
            <h2>{round.evidence.marketMood}</h2>
          </div>
          <button className="ghostButton" type="button" onClick={nextRound}>
            <RefreshCw size={17} />
            New case
          </button>
        </div>

        <StageRail result={result} selectedActor={selectedActor} />

        <JudgeMode round={round} />

        <EvidenceLedger round={round} />

        <div id="market-data"><MarketPulse pulse={round.evidence.marketPulse} selectedToken={selectedMarketToken} onSelect={setSelectedMarketToken} /></div>

        <ActionBrief round={round} objective={objective} onObjectiveChange={setObjective} onInspect={(id) => setSelectedId(id)} />

        <div id="investigation" className="investigationFrame">
        <div className="suspectGrid">
          {round.actors.map((actor) => (
            <SuspectCard
              key={actor.id}
              actor={actor}
              selected={actor.id === selectedId}
              revealed={Boolean(result)}
              correct={actor.persona === round.targetPersona}
              onSelect={() => !result && setSelectedId(actor.id)}
            />
          ))}
        </div>
        </div>

        <div id="agent-room" className="deductionPanel">
          <div className="clueBoard">
            <p className="sectionLabel">Clue Board</p>
            {selectedActor ? (
              <>
                <h3>{selectedActor.handle}</h3>
                <ul>
                  {selectedActor.clues.map((clue) => (
                    <li key={clue}>
                      <Eye size={16} />
                      <span>{clue}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="emptyState">
                <Crosshair size={28} />
                <span>Select a suspect to inspect their onchain tells.</span>
              </div>
            )}
          </div>

          <div className="agentBoard">
            <p className="sectionLabel">Agent Council</p>
            {selectedActor ? (
              <>
                <h3>{selectedActor.handle} council</h3>
                <div className="agentGrid">
                  {selectedActor.agents.map((agent) => (
                    <div className={`agentTile ${agent.status}`} key={`${selectedActor.id}-${agent.role}`}>
                      <div className="agentTileHeader">
                        <Bot size={16} />
                        <span>{agent.role}</span>
                        <strong>{agent.confidence}%</strong>
                      </div>
                      <p>{agent.output}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="emptyState">
                <Radar size={28} />
                <span>Select a suspect to activate their agents.</span>
              </div>
            )}
          </div>

          <div className="verdictBox">
            <p className="sectionLabel">Verdict</p>
            {result ? (
              <Reveal result={result} correctActor={correctActor} />
            ) : (
              <>
                <h3>Who is the hidden {round.targetPersona}?</h3>
                <p>
                  Pick the actor whose wallet behavior best matches the target identity. The reveal
                  explains the actual signal.
                </p>
                <button
                  className="primaryButton"
                  type="button"
                  disabled={!selectedActor}
                  onClick={submitGuess}
                >
                  <BadgeCheck size={18} />
                  Lock deduction
                </button>
              </>
            )}
          </div>
        </div>
        <div id="settings" className="vaultFrame"><p className="sectionLabel">Settings / Data Vault</p><h3>Evidence connection</h3><p>{round.evidence.creditsNote}</p><span>Source: <strong>{round.evidence.source === "local" ? "Local Nansen snapshot" : "Live Nansen"}</strong> · {round.evidence.chain} · {round.evidence.timeframe} · captured {formatDate(round.evidence.generatedAt)}</span></div>
      </section>
    </main>
  );
}

function WorkspaceNav() {
  const items = [
    ["home", Home, "Home"],
    ["market-data", Table2, "Market Data"],
    ["investigation", Crosshair, "Investigation"],
    ["agent-room", UsersRound, "Agent Room"],
    ["settings", Settings, "Data Vault"]
  ] as const;
  return <div className="workspaceNav" aria-label="Workspace navigation">{items.map(([id, Icon, label]) => <button type="button" key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}><Icon size={15} />{label}</button>)}</div>;
}

function DataRequiredState({ message }: { message: string }) {
  return (
    <main className="app loading">
      <div className="dataRequired">
        <Radar size={32} />
        <p className="sectionLabel">Nansen Data Required</p>
        <h1>This workspace never invents market data.</h1>
        <p>{message}</p>
        <code>NANSEN_API_KEY=... npm run nansen:workflow -- --run</code>
      </div>
    </main>
  );
}

function DashboardHome({ round, onSelectToken }: { round: GameRound; onSelectToken: (token: MarketPulseRow) => void }) {
  const pulse = round.evidence.marketPulse;
  const volumeLeader = pulse?.top_volume[0];
  const gainer = pulse?.top_gainers_7d[0];
  const loser = pulse?.top_losers_7d[0];
  const useCases = [
    ["Volume Radar", "Find where liquidity is concentrating", volumeLeader ? `${volumeLeader.token_symbol} · ${formatCurrency(volumeLeader.volume ?? 0)}` : "Waiting for screener snapshot"],
    ["Momentum Watch", "Find the strongest seven-day movers", gainer ? `${gainer.token_symbol} · ${(gainer.price_change ?? 0).toFixed(2)}%` : "Waiting for screener snapshot"],
    ["Drawdown Watch", "Find tokens losing ground this week", loser ? `${loser.token_symbol} · ${(loser.price_change ?? 0).toFixed(2)}%` : "Waiting for screener snapshot"],
    ["Wallet Intent", "Explain the selected token with agents", `${round.evidence.tokenSymbol} · ${round.actors.length} evidence actors`]
  ];

  return (
    <section className="dashboardHome" aria-label="Nansen intelligence dashboard">
      <div className="dashboardHeader">
        <div><p className="sectionLabel">Nansen Intelligence Workspace</p><h2>Choose a market question.</h2><p>Every window below is backed by the saved Nansen evidence pack. Select a signal, then open the agent investigation.</p></div>
        <div className="dataStamp"><span className="liveDot" /> {round.evidence.source === "local" ? "Local evidence vault" : "Live Nansen"}<strong>{round.evidence.chain} · {round.evidence.timeframe}</strong></div>
      </div>
      <div className="useCaseGrid">
        {useCases.map(([title, description, value], index) => {
          const lead = index === 0 ? volumeLeader : index === 1 ? gainer : index === 2 ? loser : undefined;
          return <button className={`useCaseWindow window${index}`} key={title} type="button" onClick={() => lead && onSelectToken(lead)}>
            <span className="windowIndex">0{index + 1}</span>
            <h3>{title}</h3>
            <p>{description}</p>
            <strong>{value}</strong>
            <small>{lead ? "Open ranked signal" : "Open current wallet case"}</small>
          </button>;
        })}
      </div>
      <div className="dashboardMetrics">
        <span><small>Token under investigation</small><strong>{round.evidence.tokenSymbol}</strong></span>
        <span><small>Evidence calls saved</small><strong>{round.evidence.callsUsed}</strong></span>
        <span><small>Agent perspectives</small><strong>{round.actors.length * 5}</strong></span>
        <span><small>Snapshot time</small><strong>{formatDate(round.evidence.generatedAt)}</strong></span>
      </div>
    </section>
  );
}

function TokenSelector({ round, selectedToken, onSelect, onPlay }: { round: GameRound; selectedToken: MarketPulseRow | null; onSelect: (token: MarketPulseRow | null) => void; onPlay: (token: MarketPulseRow) => void }) {
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState("all");
  const pulse = round.evidence.marketPulse;
  const options = [
    { chain: round.evidence.chain.toLowerCase(), token_symbol: round.evidence.tokenSymbol, token_address: round.evidence.tokenAddress, volume: undefined, price_change: undefined, netflow: undefined },
    ...(pulse ? [...pulse.top_volume, ...pulse.top_gainers_7d, ...pulse.top_losers_7d] : [])
  ].filter((token, index, all) => all.findIndex((item) => item.token_address === token.token_address) === index);
  const chains = [...new Set(options.map((token) => token.chain))];
  const filtered = options.filter((token) => {
    const text = `${token.token_symbol} ${token.token_address} ${token.chain}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (chain === "all" || token.chain === chain);
  });
  const playable = Boolean(selectedToken);
  const deepEvidence = selectedToken?.token_symbol.toUpperCase() === round.evidence.tokenSymbol.toUpperCase();

  return (
    <section className="tokenSelector" aria-label="Token and chain selector">
      <div className="selectorHeader"><div><p className="sectionLabel">Choose Investigation</p><h3>Search a token, filter a chain, then play.</h3></div><span>{filtered.length} real Nansen result{filtered.length === 1 ? "" : "s"}</span></div>
      <div className="selectorControls">
        <label className="searchControl"><Eye size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search token or contract address" /></label>
        <label className="chainControl"><WalletCards size={16} /><select value={chain} onChange={(event) => setChain(event.target.value)}><option value="all">All chains</option>{chains.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
      <div className="tokenResults">
        {filtered.slice(0, 12).map((token) => <button className={`tokenOption ${selectedToken?.token_address === token.token_address ? "selected" : ""}`} type="button" onClick={() => onSelect(token)} key={token.token_address}><strong>{token.token_symbol}</strong><span>{token.chain}</span><small>{token.token_address.slice(0, 8)}...{token.token_address.slice(-6)}</small>{token.token_symbol.toUpperCase() === round.evidence.tokenSymbol.toUpperCase() ? <em>PLAYABLE</em> : null}</button>)}
        {!filtered.length ? <p className="selectorEmpty">No matching token in the saved Nansen snapshot.</p> : null}
      </div>
      {selectedToken ? <div className="playDock"><div><span>Selected</span><strong>{selectedToken.token_symbol} · {selectedToken.chain}</strong><small>{deepEvidence ? "Full Nansen wallet evidence is ready." : "Screener case ready: agents will reason from the selected token's real Nansen market metrics."}</small></div><button className="primaryButton" type="button" disabled={!playable} onClick={() => onPlay(selectedToken)}><Crosshair size={17} /> Play {selectedToken.token_symbol} investigation</button></div> : null}
    </section>
  );
}

function SignalVisualization({ round }: { round: GameRound }) {
  const maxFlow = Math.max(...round.actors.map((actor) => Math.abs(actor.netFlowUsd)), 1);
  return (
    <section className="signalViz" aria-label="Nansen signal visualization">
      <div className="vizHeading"><div><p className="sectionLabel">Signal Map</p><h3>Where the evidence is actually pointing</h3></div><span>Derived from saved Nansen rows</span></div>
      <div className="vizGrid">
        <div className="flowChart">
          <div className="chartTitle"><strong>Wallet segment flow</strong><small>USD net flow</small></div>
          {round.actors.map((actor) => (
            <div className="flowBar" key={actor.id}>
              <span>{actor.handle}</span><div><i className={actor.netFlowUsd < 0 ? "down" : "up"} style={{ width: `${Math.max(5, Math.round((Math.abs(actor.netFlowUsd) / maxFlow) * 100))}%` }} /></div><b className={actor.netFlowUsd < 0 ? "negative" : "positive"}>{formatCurrency(actor.netFlowUsd)}</b>
            </div>
          ))}
        </div>
        <div className="metricMatrix">
          <MetricTile label="Largest positive flow" value={formatCurrency(Math.max(...round.actors.map((actor) => actor.netFlowUsd)))} />
          <MetricTile label="Largest negative flow" value={formatCurrency(Math.min(...round.actors.map((actor) => actor.netFlowUsd)))} />
          <MetricTile label="Wallets represented" value={new Intl.NumberFormat("en-US").format(round.actors.reduce((sum, actor) => sum + actor.walletCount, 0))} />
          <MetricTile label="Highest confidence" value={`${Math.max(...round.actors.map((actor) => actor.confidence))}%`} />
        </div>
      </div>
    </section>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return <div className="metricTile"><small>{label}</small><strong>{value}</strong></div>;
}

type ResearchObjective = "opportunity" | "risk" | "explain";

function ActionBrief({
  round,
  objective,
  onObjectiveChange,
  onInspect
}: {
  round: GameRound;
  objective: ResearchObjective;
  onObjectiveChange: (objective: ResearchObjective) => void;
  onInspect: (id: string) => void;
}) {
  const recommended = [...round.actors].sort((a, b) => {
    if (objective === "risk") return Math.abs(b.netFlowUsd) - Math.abs(a.netFlowUsd);
    if (objective === "explain") return b.confidence - a.confidence;
    return b.confidence + (b.netFlowUsd > 0 ? 10 : 0) - (a.confidence + (a.netFlowUsd > 0 ? 10 : 0));
  })[0];

  const copy: Record<ResearchObjective, { label: string; title: string; text: string }> = {
    opportunity: {
      label: "Find opportunity",
      title: recommended.netFlowUsd >= 0 ? `${recommended.handle} is the strongest positive signal.` : "No clean accumulation signal is visible.",
      text: recommended.netFlowUsd >= 0
        ? `Agents found ${formatCurrency(recommended.netFlowUsd)} of positive flow with ${recommended.walletCount || "untracked"} wallet${recommended.walletCount === 1 ? "" : "s"}. Inspect the evidence before acting.`
        : "The strongest signals are negative or too isolated. Treat the token as a watchlist item, not a chase."
    },
    risk: {
      label: "Find risk",
      title: `${recommended.handle} carries the largest exposure signal.`,
      text: `${formatCurrency(Math.abs(recommended.netFlowUsd))} of absolute flow and ${recommended.confidence}% model confidence make this the first risk check.`
    },
    explain: {
      label: "Explain the move",
      title: `${recommended.handle} best explains the current setup.`,
      text: `The council's ${recommended.confidence}% confidence is supported by ${recommended.agents.filter((agent) => agent.status === "convicted" || agent.status === "watching").length} corroborating agents.`
    }
  };

  return (
    <section className="actionBrief" aria-label="Agentic research brief">
      <div className="briefCopy">
        <div className="briefTitle"><Sparkles size={18} /><p className="sectionLabel">Agentic Research Brief</p></div>
        <h3>{copy[objective].title}</h3>
        <p>{copy[objective].text}</p>
        <button className="primaryButton briefButton" type="button" onClick={() => onInspect(recommended.id)}>
          <Crosshair size={17} /> Inspect recommended signal
        </button>
      </div>
      <div className="objectivePanel">
        <span>What are you researching?</span>
        <div className="objectiveList">
          {(["opportunity", "risk", "explain"] as ResearchObjective[]).map((value) => (
            <button className={objective === value ? "objective active" : "objective"} type="button" key={value} onClick={() => onObjectiveChange(value)}>
              {value === objective ? <CheckCircle2 size={16} /> : <span className="objectiveDot" />}
              {value === "opportunity" ? "Find opportunity" : value === "risk" ? "Find risk" : "Explain the move"}
            </button>
          ))}
        </div>
        <small>One click activates the relevant suspect and its full agent council.</small>
      </div>
    </section>
  );
}

function JudgeMode({ round }: { round: GameRound }) {
  const criteria = [
    {
      label: "Data Integration",
      proof: `${round.evidence.source === "local" ? "Local Nansen snapshot" : "Nansen data"} generates suspects, clues, agents, target role, and verdict logic.`
    },
    {
      label: "Originality",
      proof: "A social deduction game, not a dashboard, scanner, terminal, or generic research agent."
    },
    {
      label: "Workability",
      proof: "The app runs from a saved Nansen evidence vault or a live Nansen request; it refuses to fabricate market data."
    },
    {
      label: "Documentation",
      proof: "README plus submission checklist explain setup, API usage, recording, and entry steps."
    }
  ];

  return (
    <section className="judgeMode" aria-label="Buildathon judging criteria">
      <div className="judgeModeHeader">
        <ClipboardCheck size={20} />
        <div>
          <p className="sectionLabel">Judge Mode</p>
          <h3>Built to satisfy all four scoring categories</h3>
        </div>
      </div>
      <div className="criteriaGrid">
        {criteria.map((item) => (
          <div className="criteriaTile" key={item.label}>
            <CheckCircle2 size={18} />
            <strong>{item.label}</strong>
            <p>{item.proof}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StageRail({ result, selectedActor }: { result: GuessResult | null; selectedActor: RoundActor | null }) {
  const stages = [
    { icon: ClipboardCheck, label: "Briefing", done: true },
    { icon: Crosshair, label: "Investigation", done: Boolean(selectedActor) },
    { icon: BadgeCheck, label: "Verdict", done: Boolean(result) }
  ];

  return (
    <div className="stageRail" aria-label="Case workflow">
      {stages.map(({ icon: Icon, label, done }, index) => (
        <div className={`stage ${done ? "done" : ""}`} key={label}>
          <span className="stageNumber">0{index + 1}</span>
          <Icon size={16} />
          <strong>{label}</strong>
          {index < stages.length - 1 ? <span className="stageLine" /> : null}
        </div>
      ))}
    </div>
  );
}

function EvidenceLedger({ round }: { round: GameRound }) {
  const feeds = [
    ["Smart Money Netflow", "Finds the capital flow that creates the case", `${round.evidence.callsUsed} call${round.evidence.callsUsed === 1 ? "" : "s"}`],
    ["Who Bought / Sold", "Maps buy-versus-sell behavior into suspect clues", "Movement"],
    ["Token God Mode Holders", "Measures concentration and holder conviction", "Risk"],
    ["Token OHLCV", "Checks whether price confirms the wallet signal", "Judge"]
  ];

  return (
    <section className="evidenceLedger" aria-label="Nansen evidence ledger">
      <div className="ledgerHeading">
        <div>
          <p className="sectionLabel">Evidence Ledger</p>
          <h3>Every Nansen feed has a job in the decision.</h3>
        </div>
        <span className="freshness"><span className="liveDot" /> {round.evidence.source === "local" ? "Saved proof pack" : "Live response"}</span>
      </div>
      <div className="feedGrid">
        {feeds.map(([name, role, output]) => (
          <div className="feedRow" key={name}>
            <div className="feedIcon"><Radar size={16} /></div>
            <div><strong>{name}</strong><p>{role}</p></div>
            <span>{output}</span>
          </div>
        ))}
      </div>
      <div className="ledgerFooter">
        <span>Chain <strong>{round.evidence.chain}</strong></span>
        <span>Window <strong>{round.evidence.timeframe}</strong></span>
        <span>Generated <strong>{formatDate(round.evidence.generatedAt)}</strong></span>
        <span>Actors <strong>{round.actors.length}</strong></span>
      </div>
    </section>
  );
}

function MarketPulse({ pulse, selectedToken, onSelect }: { pulse: GameRound["evidence"]["marketPulse"]; selectedToken: MarketPulseRow | null; onSelect: (token: MarketPulseRow) => void }) {
  if (!pulse) return null;
  const columns = [
    ["Top traded volume", pulse.top_volume, "volume"],
    ["7D gainers", pulse.top_gainers_7d, "price_change"],
    ["7D losers", pulse.top_losers_7d, "price_change"]
  ] as const;

  return (
    <section className="marketPulse" aria-label="Market pulse">
      <div className="ledgerHeading">
        <div><p className="sectionLabel">Market Pulse</p><h3>Use the market leaders to choose the next case.</h3></div>
        <span className="freshness">Nansen Token Screener · 7d</span>
      </div>
      <div className="pulseGrid">
        {columns.map(([title, rows, metric]) => (
          <div className="pulseColumn" key={title}>
            <strong>{title}</strong>
            {rows.slice(0, 5).map((row) => (
              <button className={`pulseRow ${selectedToken?.token_address === row.token_address ? "selected" : ""}`} type="button" onClick={() => onSelect(row)} key={`${title}-${row.chain}-${row.token_address}`}>
                <span><b>{row.token_symbol}</b><small>{row.chain}</small></span>
                <em className={metric === "price_change" && (row.price_change ?? 0) < 0 ? "negative" : "positive"}>
                  {metric === "volume" ? formatCurrency(row.volume ?? 0) : `${(row.price_change ?? 0).toFixed(2)}%`}
                </em>
              </button>
            ))}
            {!rows.length ? <p className="pulseEmpty">Run the workflow to populate this feed.</p> : null}
          </div>
        ))}
      </div>
      {selectedToken ? <div className="selectedLead"><div><p className="sectionLabel">Selected Lead</p><h3>{selectedToken.token_symbol} <span>{selectedToken.chain}</span></h3></div><div className="leadMetrics"><span>Volume <b>{formatCurrency(selectedToken.volume ?? 0)}</b></span><span>7D change <b className={(selectedToken.price_change ?? 0) < 0 ? "negative" : "positive"}>{(selectedToken.price_change ?? 0).toFixed(2)}%</b></span><span>Netflow <b className={(selectedToken.netflow ?? 0) < 0 ? "negative" : "positive"}>{formatCurrency(selectedToken.netflow ?? 0)}</b></span></div><small>Screening lead selected. Full wallet agents will activate after a token-specific Nansen evidence sync.</small></div> : null}
    </section>
  );
}

function EvidenceStrip({ round }: { round: GameRound }) {
  return (
    <div className="evidenceStrip">
      <span>
        <WalletCards size={15} />
        {round.evidence.chain}
      </span>
      <span>
        <Flame size={15} />
        {round.evidence.tokenSymbol}
      </span>
      <span>
        <Gauge size={15} />
        {round.evidence.timeframe}
      </span>
      <span>
        <Brain size={15} />
        {round.evidence.source === "nansen"
          ? "Live Nansen"
          : round.evidence.source === "local"
            ? "Local Nansen"
            : "Demo Data"}
      </span>
    </div>
  );
}

function SuspectCard({
  actor,
  selected,
  revealed,
  correct,
  onSelect
}: {
  actor: RoundActor;
  selected: boolean;
  revealed: boolean;
  correct: boolean;
  onSelect: () => void;
}) {
  const flowClass = actor.netFlowUsd >= 0 ? "positive" : "negative";

  return (
    <button
      className={`suspectCard ${selected ? "selected" : ""} ${revealed && correct ? "correct" : ""}`}
      type="button"
      onClick={onSelect}
    >
      <div className="avatar" style={{ background: actor.avatarGradient }}>
        {personaIcons[actor.persona]}
      </div>
      <div className="suspectTopline">
        <span>{actor.visibleRole}</span>
        <strong>{actor.handle}</strong>
      </div>
      <div className="statRow">
        <span>Net Flow</span>
        <strong className={flowClass}>{formatCurrency(actor.netFlowUsd)}</strong>
      </div>
      <div className="statGrid">
        <span>
          <small>Wallets</small>
          <strong>{actor.walletCount}</strong>
        </span>
        <span>
          <small>Avg Flow</small>
          <strong>{formatCurrency(actor.avgFlowUsd)}</strong>
        </span>
        <span>
          <small>Signal</small>
          <strong>{actor.confidence}%</strong>
        </span>
      </div>
      <div className="miniAgents" aria-label={`${actor.handle} agent status`}>
        {actor.agents.slice(0, 4).map((agent) => (
          <span className={agent.status} key={agent.role}>
            {agent.role}
          </span>
        ))}
      </div>
      {revealed ? <div className="personaTag">{actor.persona}</div> : null}
    </button>
  );
}

function Reveal({
  result,
  correctActor
}: {
  result: GuessResult;
  correctActor?: RoundActor;
}) {
  return (
    <div className={`reveal ${result.isCorrect ? "win" : "miss"}`}>
      <div className="caseClosed"><CheckCircle2 size={16} /> CASE CLOSED</div>
      <h3>{result.isCorrect ? "Correct deduction." : "Close, but the chain disagrees."}</h3>
      <p>{result.selectedActor.reveal}</p>
      {!result.isCorrect && correctActor ? (
        <p>
          The hidden actor was <strong>{correctActor.handle}</strong>: {correctActor.reveal}
        </p>
      ) : null}
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recorded locally" : date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const compact =
    abs >= 1_000_000_000
      ? `${(abs / 1_000_000_000).toFixed(1)}B`
      : abs >= 1_000_000
      ? `${(abs / 1_000_000).toFixed(1)}M`
      : abs >= 1_000
        ? `${Math.round(abs / 1_000)}K`
        : `${abs}`;
  return `${value < 0 ? "-" : ""}$${compact}`;
}
