"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const teams = [
  { id: "team-001", name: "Argentina" },
  { id: "team-002", name: "France" },
  { id: "team-004", name: "England" },
  { id: "team-005", name: "Spain" },
  { id: "team-011", name: "Arsenal" },
  { id: "team-012", name: "Manchester City" },
  { id: "team-013", name: "Liverpool" },
  { id: "team-015", name: "Real Madrid" },
  { id: "team-016", name: "Barcelona" },
  { id: "team-017", name: "Bayern Munich" },
];

interface MatchEvent {
  minute: number;
  type: "goal" | "yellow_card" | "red_card" | "substitution";
  team: "home" | "away";
  player: string;
}

export default function SimulatePage() {
  const [homeTeam, setHomeTeam] = useState("team-011");
  const [awayTeam, setAwayTeam] = useState("team-014");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [probabilities, setProbabilities] = useState({ homeWin: 45.0, draw: 28.0, awayWin: 27.0 });
  const [isComplete, setIsComplete] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const homeTeamName = teams.find((t) => t.id === homeTeam)?.name || "Home";
  const awayTeamName = teams.find((t) => t.id === awayTeam)?.name || "Away";

  const startSimulation = () => {
    setIsRunning(true);
    setIsPaused(false);
    setIsComplete(false);
    setCurrentMinute(0);
    setEvents([]);
    setHomeGoals(0);
    setAwayGoals(0);
    setProbabilities({ homeWin: 45.0, draw: 28.0, awayWin: 27.0 });
  };

  const togglePause = () => setIsPaused(!isPaused);

  const resetSimulation = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsComplete(false);
    setCurrentMinute(0);
    setEvents([]);
    setHomeGoals(0);
    setAwayGoals(0);
    setProbabilities({ homeWin: 45.0, draw: 28.0, awayWin: 27.0 });
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Simulation loop
  useEffect(() => {
    if (!isRunning || isPaused || isComplete) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const interval = 3000 / speed; // 1x = 3s per minute (Req 10.4)
    intervalRef.current = setInterval(() => {
      setCurrentMinute((prev) => {
        const next = prev + 1;
        if (next > 95) {
          setIsComplete(true);
          setIsRunning(false);
          return prev;
        }

        // Generate random events
        const goalChance = 0.028; // ~2.5 goals per match
        const cardChance = 0.008;

        if (Math.random() < goalChance) {
          const team = Math.random() < 0.55 ? "home" : "away";
          const newEvent: MatchEvent = {
            minute: next,
            type: "goal",
            team,
            player: team === "home" ? `${homeTeamName} Player` : `${awayTeamName} Player`,
          };
          setEvents((e) => [...e, newEvent]);
          if (team === "home") {
            setHomeGoals((g) => g + 1);
          } else {
            setAwayGoals((g) => g + 1);
          }
        } else if (Math.random() < cardChance) {
          const team = Math.random() < 0.5 ? "home" : "away";
          setEvents((e) => [...e, {
            minute: next,
            type: "yellow_card",
            team,
            player: team === "home" ? `${homeTeamName} Player` : `${awayTeamName} Player`,
          }]);
        }

        return next;
      });
    }, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, isComplete, speed, homeTeamName, awayTeamName]);

  // Update probabilities when score changes
  useEffect(() => {
    const remaining = (90 - currentMinute) / 90;
    const goalDiff = homeGoals - awayGoals;

    let homeWin: number, draw: number, awayWin: number;

    if (currentMinute >= 90) {
      if (goalDiff > 0) { homeWin = 100; draw = 0; awayWin = 0; }
      else if (goalDiff === 0) { homeWin = 0; draw = 100; awayWin = 0; }
      else { homeWin = 0; draw = 0; awayWin = 100; }
    } else if (goalDiff > 0) {
      homeWin = Math.min(95, 50 + goalDiff * 18 - remaining * 10);
      draw = Math.max(3, 28 - goalDiff * 10 + remaining * 5);
      awayWin = 100 - homeWin - draw;
    } else if (goalDiff < 0) {
      awayWin = Math.min(95, 50 + Math.abs(goalDiff) * 18 - remaining * 10);
      draw = Math.max(3, 28 - Math.abs(goalDiff) * 10 + remaining * 5);
      homeWin = 100 - awayWin - draw;
    } else {
      homeWin = 38 + remaining * 7;
      draw = 30 - remaining * 3;
      awayWin = 100 - homeWin - draw;
    }

    setProbabilities({
      homeWin: Math.round(Math.max(0, homeWin) * 10) / 10,
      draw: Math.round(Math.max(0, draw) * 10) / 10,
      awayWin: Math.round(Math.max(0, awayWin) * 10) / 10,
    });
  }, [homeGoals, awayGoals, currentMinute]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Match Timeline Simulator</h1>
        <p className="mt-2 text-muted-foreground">
          Watch a match unfold minute by minute with live probability updates.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm mb-6">
        <div className="grid gap-4 md:grid-cols-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">Home Team</label>
            <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} disabled={isRunning} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm disabled:opacity-50">
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Away Team</label>
            <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} disabled={isRunning} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm disabled:opacity-50">
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Speed</label>
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
              <option value={1}>1x (Real-time)</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
              <option value={10}>10x (Fast)</option>
            </select>
          </div>
          <div className="flex gap-2">
            {!isRunning && !isComplete && (
              <button onClick={startSimulation} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Start
              </button>
            )}
            {isRunning && (
              <button onClick={togglePause} className="flex-1 rounded-lg border border-input px-4 py-2.5 text-sm font-medium hover:bg-accent">
                {isPaused ? "Resume" : "Pause"}
              </button>
            )}
            {(isRunning || isComplete) && (
              <button onClick={resetSimulation} className="flex-1 rounded-lg border border-input px-4 py-2.5 text-sm font-medium hover:bg-accent">
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Match Display */}
      {(isRunning || isComplete || events.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Score & Probabilities */}
          <div className="space-y-4">
            {/* Scoreboard */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm text-center">
              <div className="text-sm text-muted-foreground mb-2">
                {isComplete ? "Full Time" : `${currentMinute}'`}
              </div>
              <div className="text-4xl font-bold">
                <span>{homeGoals}</span>
                <span className="mx-4 text-muted-foreground">-</span>
                <span>{awayGoals}</span>
              </div>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>{homeTeamName}</span>
                <span>{awayTeamName}</span>
              </div>
            </div>

            {/* Live Probabilities */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <h3 className="font-semibold mb-4 text-sm">Win Probability</h3>
              <div className="space-y-3">
                <ProbBar label={homeTeamName} value={probabilities.homeWin} color="bg-green-500" />
                <ProbBar label="Draw" value={probabilities.draw} color="bg-yellow-500" />
                <ProbBar label={awayTeamName} value={probabilities.awayWin} color="bg-blue-500" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>0'</span>
                <span>45'</span>
                <span>90'</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${Math.min(100, (currentMinute / 95) * 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">Match Events</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Match in progress... waiting for events.
                </p>
              ) : (
                events.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                      event.type === "goal" ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                    )}
                  >
                    <span className="font-mono text-xs text-muted-foreground w-8">{event.minute}'</span>
                    <span className="text-base">
                      {event.type === "goal" && "⚽"}
                      {event.type === "yellow_card" && "🟡"}
                      {event.type === "red_card" && "🔴"}
                      {event.type === "substitution" && "🔄"}
                    </span>
                    <span className={cn("font-medium", event.team === "home" ? "text-green-400" : "text-blue-400")}>
                      {event.team === "home" ? homeTeamName : awayTeamName}
                    </span>
                    {event.type === "goal" && <span className="text-primary font-semibold">GOAL!</span>}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}
