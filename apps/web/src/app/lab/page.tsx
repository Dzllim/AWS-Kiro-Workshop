"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const predictionFactors = [
  { key: "eloRating", label: "Elo Rating", defaultWeight: 75 },
  { key: "recentForm", label: "Recent Form", defaultWeight: 80 },
  { key: "headToHead", label: "Head-to-Head", defaultWeight: 50 },
  { key: "xG", label: "Expected Goals (xG)", defaultWeight: 70 },
  { key: "homeAdvantage", label: "Home Advantage", defaultWeight: 65 },
  { key: "playerAvailability", label: "Player Availability", defaultWeight: 60 },
  { key: "restDays", label: "Rest Days", defaultWeight: 40 },
  { key: "managerHistory", label: "Manager History", defaultWeight: 30 },
];

const teams = [
  { id: "team-001", name: "Argentina" },
  { id: "team-002", name: "France" },
  { id: "team-003", name: "Brazil" },
  { id: "team-004", name: "England" },
  { id: "team-005", name: "Spain" },
  { id: "team-011", name: "Arsenal" },
  { id: "team-012", name: "Manchester City" },
  { id: "team-013", name: "Liverpool" },
  { id: "team-015", name: "Real Madrid" },
  { id: "team-016", name: "Barcelona" },
];

export default function PredictionLabPage() {
  const [homeTeam, setHomeTeam] = useState("team-001");
  const [awayTeam, setAwayTeam] = useState("team-002");
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(predictionFactors.map((f) => [f.key, f.defaultWeight]))
  );
  const [probabilities, setProbabilities] = useState({ homeWin: 42.5, draw: 27.3, awayWin: 30.2 });
  const [loading, setLoading] = useState(false);

  const handleWeightChange = useCallback((key: string, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);

    // Debounced recalculation (simulated for now)
    // In production this calls POST /predictions/lab
    recalculate(newWeights);
  }, [weights]);

  const recalculate = (newWeights: Record<string, number>) => {
    // Normalize weights (Req 3.5)
    const total = Object.values(newWeights).reduce((s, v) => s + v, 0);
    if (total === 0) {
      // Equal weights (Req 3.6)
      setProbabilities({ homeWin: 33.3, draw: 33.4, awayWin: 33.3 });
      return;
    }

    // Simulated calculation - in production this calls the API
    const normalized = Object.entries(newWeights).reduce((acc, [k, v]) => {
      acc[k] = v / total;
      return acc;
    }, {} as Record<string, number>);

    // Simple simulation of how weights affect probabilities
    const eloEffect = (normalized.eloRating || 0) * 15;
    const formEffect = (normalized.recentForm || 0) * 12;
    const homeEffect = (normalized.homeAdvantage || 0) * 10;

    const baseHome = 35 + eloEffect + formEffect + homeEffect;
    const baseDraw = 28 - (eloEffect + formEffect) * 0.3;
    const baseAway = 100 - baseHome - baseDraw;

    setProbabilities({
      homeWin: Math.round(Math.max(5, Math.min(85, baseHome)) * 10) / 10,
      draw: Math.round(Math.max(5, Math.min(40, baseDraw)) * 10) / 10,
      awayWin: Math.round(Math.max(5, Math.min(85, baseAway)) * 10) / 10,
    });
  };

  const resetWeights = () => {
    const defaults = Object.fromEntries(predictionFactors.map((f) => [f.key, f.defaultWeight]));
    setWeights(defaults);
    recalculate(defaults);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Prediction Lab</h1>
        <p className="mt-2 text-muted-foreground">
          Adjust the importance of each prediction factor and watch probabilities update in real-time.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Weight Sliders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Selection */}
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Home Team</label>
                <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Away Team</label>
                <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Sliders */}
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Factor Weights</h3>
              <button
                onClick={resetWeights}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="space-y-5">
              {predictionFactors.map((factor) => (
                <div key={factor.key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">{factor.label}</label>
                    <span className="text-sm font-mono text-muted-foreground">{weights[factor.key]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={weights[factor.key]}
                    onChange={(e) => handleWeightChange(factor.key, parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Results */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm sticky top-24">
            <h3 className="font-semibold mb-6 text-center">Live Prediction</h3>

            {/* Animated probability display */}
            <div className="space-y-4">
              <motion.div
                className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 0.3 }}
                key={probabilities.homeWin}
              >
                <div className="text-sm text-muted-foreground mb-1">
                  {teams.find(t => t.id === homeTeam)?.name || "Home"} Win
                </div>
                <div className="text-3xl font-bold text-green-400">{probabilities.homeWin}%</div>
              </motion.div>

              <motion.div
                className="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 0.3 }}
                key={probabilities.draw}
              >
                <div className="text-sm text-muted-foreground mb-1">Draw</div>
                <div className="text-3xl font-bold text-yellow-400">{probabilities.draw}%</div>
              </motion.div>

              <motion.div
                className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 0.3 }}
                key={probabilities.awayWin}
              >
                <div className="text-sm text-muted-foreground mb-1">
                  {teams.find(t => t.id === awayTeam)?.name || "Away"} Win
                </div>
                <div className="text-3xl font-bold text-blue-400">{probabilities.awayWin}%</div>
              </motion.div>
            </div>

            {/* Visual bar */}
            <div className="mt-6 h-3 rounded-full overflow-hidden flex">
              <motion.div
                className="bg-green-500"
                animate={{ width: `${probabilities.homeWin}%` }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="bg-yellow-500"
                animate={{ width: `${probabilities.draw}%` }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="bg-blue-500"
                animate={{ width: `${probabilities.awayWin}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
