"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const scenarioTypes = [
  { type: "player_injury", label: "Player Injury", icon: "🤕", description: "Key player unavailable" },
  { type: "red_card", label: "Red Card", icon: "🔴", description: "Team reduced to 10 players" },
  { type: "weather", label: "Bad Weather", icon: "🌧️", description: "Rain affects gameplay" },
  { type: "venue_change", label: "Neutral Venue", icon: "🏟️", description: "Remove home advantage" },
];

interface Scenario {
  id: number;
  type: string;
  label: string;
  team: "home" | "away";
}

export default function WhatIfPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [baseline] = useState({ homeWin: 52.3, draw: 25.1, awayWin: 22.6 });
  const [adjusted, setAdjusted] = useState({ homeWin: 52.3, draw: 25.1, awayWin: 22.6 });

  const addScenario = (type: string, label: string) => {
    if (scenarios.length >= 5) return; // Max 5 scenarios (Req 9.3)

    const newScenario: Scenario = {
      id: Date.now(),
      type,
      label,
      team: "home",
    };
    const updated = [...scenarios, newScenario];
    setScenarios(updated);
    recalculate(updated);
  };

  const removeScenario = (id: number) => {
    const updated = scenarios.filter((s) => s.id !== id);
    setScenarios(updated);
    recalculate(updated);
  };

  const recalculate = (activeScenarios: Scenario[]) => {
    // Simulate what-if impact (in production, calls API)
    let homeShift = 0;
    let drawShift = 0;

    for (const s of activeScenarios) {
      switch (s.type) {
        case "player_injury":
          homeShift -= s.team === "home" ? 3.0 : -2.0;
          drawShift += 1.0;
          break;
        case "red_card":
          homeShift -= s.team === "home" ? 8.0 : -5.0;
          drawShift += 3.0;
          break;
        case "weather":
          drawShift += 2.0;
          homeShift -= 1.0;
          break;
        case "venue_change":
          homeShift -= 4.0;
          drawShift += 1.5;
          break;
      }
    }

    const newHome = Math.max(5, Math.min(90, baseline.homeWin + homeShift));
    const newDraw = Math.max(5, Math.min(40, baseline.draw + drawShift));
    const newAway = 100 - newHome - newDraw;

    setAdjusted({
      homeWin: Math.round(newHome * 10) / 10,
      draw: Math.round(newDraw * 10) / 10,
      awayWin: Math.round(Math.max(5, newAway) * 10) / 10,
    });
  };

  const getDiff = (key: keyof typeof baseline) => {
    const diff = adjusted[key] - baseline[key];
    return diff;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">What-If Scenarios</h1>
        <p className="mt-2 text-muted-foreground">
          Simulate changes to match conditions and see how they affect predictions. (Max 5 scenarios)
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Scenario Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Base Match */}
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
            <h3 className="font-semibold mb-2">Base Prediction</h3>
            <p className="text-lg font-bold">Argentina vs France</p>
            <p className="text-sm text-muted-foreground">International • 2026-08-15</p>
          </div>

          {/* Add Scenarios */}
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">Add Scenarios ({scenarios.length}/5)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {scenarioTypes.map((s) => (
                <button
                  key={s.type}
                  onClick={() => addScenario(s.type, s.label)}
                  disabled={scenarios.length >= 5}
                  className="flex items-center gap-3 rounded-lg border border-border/50 p-3 text-left transition-all hover:border-primary/30 hover:bg-accent/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Scenarios */}
          {scenarios.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <h3 className="font-semibold mb-4">Active Scenarios</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {scenarios.map((s) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between rounded-lg border border-border/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span>{scenarioTypes.find((st) => st.type === s.type)?.icon}</span>
                        <span className="text-sm font-medium">{s.label}</span>
                        <select
                          value={s.team}
                          onChange={(e) => {
                            const updated = scenarios.map((sc) =>
                              sc.id === s.id ? { ...sc, team: e.target.value as "home" | "away" } : sc
                            );
                            setScenarios(updated);
                            recalculate(updated);
                          }}
                          className="rounded border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="home">Home Team</option>
                          <option value="away">Away Team</option>
                        </select>
                      </div>
                      <button
                        onClick={() => removeScenario(s.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Remove ${s.label} scenario`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Results Comparison */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm sticky top-24">
            <h3 className="font-semibold mb-6 text-center">Probability Comparison</h3>

            {/* Baseline vs Adjusted */}
            <div className="space-y-4">
              {(["homeWin", "draw", "awayWin"] as const).map((key) => {
                const labels = { homeWin: "Argentina Win", draw: "Draw", awayWin: "France Win" };
                const colors = { homeWin: "text-green-400", draw: "text-yellow-400", awayWin: "text-blue-400" };
                const diff = getDiff(key);
                return (
                  <div key={key} className="rounded-lg border border-border/30 p-3">
                    <div className="text-xs text-muted-foreground mb-1">{labels[key]}</div>
                    <div className="flex items-baseline justify-between">
                      <motion.span
                        key={adjusted[key]}
                        className={cn("text-2xl font-bold", colors[key])}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {adjusted[key]}%
                      </motion.span>
                      {scenarios.length > 0 && (
                        <span className={cn("text-sm font-mono", diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-muted-foreground")}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Baseline: {baseline[key]}%</div>
                  </div>
                );
              })}
            </div>

            {/* Visual bar */}
            <div className="mt-6">
              <div className="text-xs text-muted-foreground mb-2">Adjusted</div>
              <div className="h-3 rounded-full overflow-hidden flex">
                <motion.div className="bg-green-500" animate={{ width: `${adjusted.homeWin}%` }} transition={{ duration: 0.3 }} />
                <motion.div className="bg-yellow-500" animate={{ width: `${adjusted.draw}%` }} transition={{ duration: 0.3 }} />
                <motion.div className="bg-blue-500" animate={{ width: `${adjusted.awayWin}%` }} transition={{ duration: 0.3 }} />
              </div>
              <div className="text-xs text-muted-foreground mt-3 mb-1">Baseline</div>
              <div className="h-3 rounded-full overflow-hidden flex opacity-50">
                <div className="bg-green-500" style={{ width: `${baseline.homeWin}%` }} />
                <div className="bg-yellow-500" style={{ width: `${baseline.draw}%` }} />
                <div className="bg-blue-500" style={{ width: `${baseline.awayWin}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
