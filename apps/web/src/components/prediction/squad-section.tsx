"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Player {
  name: string;
  position: string;
  number?: number;
  club?: string;
  caps?: number;
  goals?: number;
  rating?: number;
  photo?: string;
}

interface SquadData {
  squad: Player[];
  startingXI: Player[];
  bench: Player[];
  injured: Player[];
  suspended: Player[];
  expectedLineup: Player[];
  formation?: string;
  available: boolean;
  source: string;
}

interface SquadSectionProps {
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  competition: string;
  matchDate?: string;
}

export function SquadSection({ homeTeamId, awayTeamId, homeTeamName, awayTeamName, competition, matchDate }: SquadSectionProps) {
  const [homeData, setHomeData] = useState<SquadData | null>(null);
  const [awayData, setAwayData] = useState<SquadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"squad" | "lineup" | "injuries">("squad");
  const [liveLineup, setLiveLineup] = useState<any>(null);
  const [lineupStatus, setLineupStatus] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    // Fetch squad data for both teams
    const squadPromises = Promise.all([
      fetch(`${apiUrl}/teams/squad-details/${encodeURIComponent(homeTeamName)}`).then(r => r.json()).catch(() => null),
      fetch(`${apiUrl}/teams/squad-details/${encodeURIComponent(awayTeamName)}`).then(r => r.json()).catch(() => null),
    ]);

    // Also check for live lineup if we have a match date
    const lineupPromise = matchDate
      ? fetch(`${apiUrl}/teams/live-lineup?home_team=${encodeURIComponent(homeTeamName)}&away_team=${encodeURIComponent(awayTeamName)}&date=${matchDate}`)
          .then(r => r.json()).catch(() => null)
      : Promise.resolve(null);

    Promise.all([squadPromises, lineupPromise]).then(([[home, away], lineup]) => {
      setHomeData(home);
      setAwayData(away);

      if (lineup?.available) {
        setLiveLineup(lineup);
        setLineupStatus("confirmed");
        // Override the expected lineup with confirmed data
        if (home && lineup.home) {
          home.startingXI = lineup.home.startingXI;
          home.formation = lineup.home.formation;
          home.bench = lineup.home.substitutes || [];
          setHomeData({...home});
        }
        if (away && lineup.away) {
          away.startingXI = lineup.away.startingXI;
          away.formation = lineup.away.formation;
          away.bench = lineup.away.substitutes || [];
          setAwayData({...away});
        }
      } else if (lineup?.fixture_id) {
        setLineupStatus("pending");
      }

      setLoading(false);
    });
  }, [homeTeamName, awayTeamName, matchDate]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
      <h3 className="font-semibold mb-4">Squad & Lineup</h3>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-muted/50 rounded-lg p-1">
        {(["squad", "lineup", "injuries"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "squad" && "Full Squad"}
            {tab === "lineup" && (lineupStatus === "confirmed" ? "✓ Confirmed XI" : "Expected XI")}
            {tab === "injuries" && "Injuries / Cards"}
          </button>
        ))}
      </div>

      {/* Live lineup status banner */}
      {lineupStatus === "confirmed" && (
        <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-400">
          ✓ Live lineup confirmed — official starting XI announced
        </div>
      )}
      {lineupStatus === "pending" && (
        <div className="mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-xs text-yellow-400">
          ⏳ Fixture found — lineup will be available ~30 min before kickoff
        </div>
      )}

      {/* Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <TeamSquadPanel
          teamName={homeTeamName}
          data={homeData}
          activeTab={activeTab}
          color="text-green-400"
        />
        <TeamSquadPanel
          teamName={awayTeamName}
          data={awayData}
          activeTab={activeTab}
          color="text-blue-400"
        />
      </div>

      <p className="text-[10px] text-muted-foreground mt-4">
        Squad data from official FIFA World Cup 2026 lists. Starting XI confirmed 30-60 min before kickoff.
      </p>
    </div>
  );
}

function TeamSquadPanel({ teamName, data, activeTab, color }: {
  teamName: string;
  data: SquadData | null;
  activeTab: "squad" | "lineup" | "injuries";
  color: string;
}) {
  if (!data || !data.available) {
    return (
      <div>
        <h4 className={cn("text-sm font-medium mb-3", color)}>{teamName}</h4>
        <p className="text-xs text-muted-foreground italic">
          Squad data not available for this team. Only FIFA World Cup 2026 squads are currently loaded.
        </p>
      </div>
    );
  }

  const positions = ["GK", "DEF", "MID", "FWD"];
  const posLabels: Record<string, string> = { GK: "Goalkeepers", DEF: "Defenders", MID: "Midfielders", FWD: "Forwards" };

  let playersToShow: Player[] = [];
  let sectionTitle = "";

  switch (activeTab) {
    case "squad":
      playersToShow = data.squad;
      sectionTitle = `Full Squad (${data.squad.length})`;
      break;
    case "lineup":
      if (data.startingXI && data.startingXI.length > 0) {
        playersToShow = data.startingXI;
        sectionTitle = `Confirmed XI${data.formation ? ` (${data.formation})` : ""}`;
      } else if (data.expectedLineup.length > 0) {
        playersToShow = data.expectedLineup;
        sectionTitle = `Expected XI${data.formation ? ` (${data.formation})` : ""}`;
      } else {
        playersToShow = data.squad.slice(0, 11);
        sectionTitle = "Probable XI (estimated)";
      }
      break;
    case "injuries":
      playersToShow = [...data.injured, ...data.suspended];
      sectionTitle = `Unavailable (${playersToShow.length})`;
      break;
  }

  return (
    <div>
      <h4 className={cn("text-sm font-medium mb-1", color)}>{teamName}</h4>
      <p className="text-[10px] text-muted-foreground mb-3">{sectionTitle}</p>

      {playersToShow.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          {activeTab === "injuries" ? "No injuries or card suspensions reported." : "Data not available yet."}
        </p>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {activeTab === "squad" || activeTab === "lineup" ? (
            // Group by position
            positions.map((pos) => {
              const posPlayers = playersToShow.filter((p) => p.position === pos);
              if (posPlayers.length === 0) return null;
              return (
                <div key={pos}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 mt-2">
                    {posLabels[pos]}
                  </div>
                  {posPlayers.map((p, i) => (
                    <PlayerRow key={i} player={p} showClub={activeTab === "squad"} />
                  ))}
                </div>
              );
            })
          ) : (
            // Injuries/suspended - flat list
            playersToShow.map((p, i) => (
              <PlayerRow key={i} player={p} showClub={true} isInjured />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player, showClub, isInjured }: { player: Player; showClub?: boolean; isInjured?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between py-1 text-sm",
      isInjured && "opacity-60"
    )}>
      <div className="flex items-center gap-2">
        {player.number && (
          <span className="text-[10px] font-mono text-muted-foreground w-4">{player.number}</span>
        )}
        <span className={cn(isInjured && "line-through")}>{player.name}</span>
        {isInjured && <span className="text-[10px] text-red-400">●</span>}
      </div>
      <div className="flex items-center gap-2">
        {player.rating && (
          <span className={cn(
            "text-[10px] font-mono px-1 rounded",
            player.rating >= 7.5 ? "bg-green-500/10 text-green-400" :
            player.rating >= 6.5 ? "bg-yellow-500/10 text-yellow-400" :
            "bg-red-500/10 text-red-400"
          )}>
            {player.rating.toFixed(1)}
          </span>
        )}
        {showClub && player.club && (
          <span className="text-[10px] text-muted-foreground max-w-[100px] truncate">{player.club}</span>
        )}
        {player.goals !== undefined && player.goals > 0 && (
          <span className="text-[10px] text-muted-foreground">{player.goals}g</span>
        )}
      </div>
    </div>
  );
}
