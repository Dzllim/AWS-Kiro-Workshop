"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const teams = [
  { id: "team-001", name: "Argentina" },
  { id: "team-002", name: "France" },
  { id: "team-003", name: "Brazil" },
  { id: "team-004", name: "England" },
  { id: "team-005", name: "Spain" },
  { id: "team-006", name: "Germany" },
  { id: "team-007", name: "Portugal" },
  { id: "team-008", name: "Netherlands" },
  { id: "team-009", name: "Italy" },
  { id: "team-010", name: "Uruguay" },
  { id: "team-011", name: "Arsenal" },
  { id: "team-012", name: "Manchester City" },
  { id: "team-013", name: "Liverpool" },
  { id: "team-014", name: "Chelsea" },
  { id: "team-015", name: "Real Madrid" },
  { id: "team-016", name: "Barcelona" },
  { id: "team-017", name: "Bayern Munich" },
  { id: "team-018", name: "Inter Milan" },
  { id: "team-019", name: "PSG" },
  { id: "team-020", name: "Borussia Dortmund" },
];

// Sample team metrics (in production, fetched from API)
const teamMetrics: Record<string, { attack: number; defence: number; passing: number; pressing: number; possession: number; xgPerMatch: number }> = {
  "team-001": { attack: 85, defence: 78, passing: 87, pressing: 72, possession: 62, xgPerMatch: 82 },
  "team-002": { attack: 82, defence: 75, passing: 85, pressing: 70, possession: 58, xgPerMatch: 78 },
  "team-003": { attack: 80, defence: 70, passing: 84, pressing: 68, possession: 60, xgPerMatch: 72 },
  "team-004": { attack: 78, defence: 76, passing: 86, pressing: 74, possession: 56, xgPerMatch: 70 },
  "team-005": { attack: 79, defence: 77, passing: 90, pressing: 76, possession: 65, xgPerMatch: 75 },
  "team-006": { attack: 76, defence: 73, passing: 86, pressing: 75, possession: 59, xgPerMatch: 70 },
  "team-007": { attack: 77, defence: 74, passing: 85, pressing: 69, possession: 57, xgPerMatch: 72 },
  "team-008": { attack: 75, defence: 72, passing: 84, pressing: 71, possession: 58, xgPerMatch: 68 },
  "team-009": { attack: 72, defence: 80, passing: 87, pressing: 67, possession: 55, xgPerMatch: 62 },
  "team-010": { attack: 74, defence: 75, passing: 82, pressing: 70, possession: 52, xgPerMatch: 65 },
  "team-011": { attack: 82, defence: 79, passing: 87, pressing: 78, possession: 61, xgPerMatch: 78 },
  "team-012": { attack: 84, defence: 80, passing: 90, pressing: 76, possession: 65, xgPerMatch: 82 },
  "team-013": { attack: 80, defence: 76, passing: 85, pressing: 80, possession: 58, xgPerMatch: 75 },
  "team-014": { attack: 72, defence: 70, passing: 84, pressing: 72, possession: 56, xgPerMatch: 65 },
  "team-015": { attack: 83, defence: 77, passing: 88, pressing: 70, possession: 60, xgPerMatch: 80 },
  "team-016": { attack: 81, defence: 74, passing: 89, pressing: 74, possession: 64, xgPerMatch: 78 },
  "team-017": { attack: 84, defence: 75, passing: 88, pressing: 77, possession: 63, xgPerMatch: 85 },
  "team-018": { attack: 78, defence: 79, passing: 86, pressing: 68, possession: 56, xgPerMatch: 72 },
  "team-019": { attack: 82, defence: 72, passing: 87, pressing: 71, possession: 62, xgPerMatch: 80 },
  "team-020": { attack: 76, defence: 70, passing: 83, pressing: 75, possession: 55, xgPerMatch: 70 },
};

const dimensions = [
  { key: "attack", label: "Attack" },
  { key: "defence", label: "Defence" },
  { key: "passing", label: "Passing" },
  { key: "pressing", label: "Pressing" },
  { key: "possession", label: "Possession" },
  { key: "xgPerMatch", label: "xG/Match" },
];

export default function ComparePage() {
  const [teamA, setTeamA] = useState("team-001");
  const [teamB, setTeamB] = useState("team-002");

  const metricsA = teamMetrics[teamA] || { attack: 50, defence: 50, passing: 50, pressing: 50, possession: 50, xgPerMatch: 50 };
  const metricsB = teamMetrics[teamB] || { attack: 50, defence: 50, passing: 50, pressing: 50, possession: 50, xgPerMatch: 50 };

  const radarData = dimensions.map((d) => ({
    dimension: d.label,
    teamA: metricsA[d.key as keyof typeof metricsA],
    teamB: metricsB[d.key as keyof typeof metricsB],
  }));

  // Calculate tactical advantages (Req 5.3)
  const diffs = dimensions.map((d) => ({
    ...d,
    diff: metricsA[d.key as keyof typeof metricsA] - metricsB[d.key as keyof typeof metricsB],
  }));
  const sortedDiffs = [...diffs].sort((a, b) => b.diff - a.diff);
  const advantagesA = sortedDiffs.filter((d) => d.diff > 0).slice(0, 3);
  const advantagesB = sortedDiffs.filter((d) => d.diff < 0).slice(-3).reverse();

  const teamAName = teams.find((t) => t.id === teamA)?.name || "Team A";
  const teamBName = teams.find((t) => t.id === teamB)?.name || "Team B";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team Comparison</h1>
        <p className="mt-2 text-muted-foreground">
          Compare two teams across 6 performance dimensions using radar charts.
        </p>
      </div>

      {/* Team Selection */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Team A</label>
            <select
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Team B</label>
            <select
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
        >
          <h3 className="font-semibold mb-4 text-center">Performance Radar</h3>
          <div className="h-[400px]" aria-label={`Radar chart comparing ${teamAName} and ${teamBName} across attack, defence, passing, pressing, possession, and xG per match`}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <Radar
                  name={teamAName}
                  dataKey="teamA"
                  stroke="hsl(142, 71%, 45%)"
                  fill="hsl(142, 71%, 45%)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name={teamBName}
                  dataKey="teamB"
                  stroke="hsl(217, 91%, 60%)"
                  fill="hsl(217, 91%, 60%)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Metrics Table + Advantages */}
        <div className="space-y-6">
          {/* Numerical Values */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
          >
            <h3 className="font-semibold mb-4">Metrics Comparison</h3>
            <div className="space-y-3">
              {dimensions.map((d) => {
                const valA = metricsA[d.key as keyof typeof metricsA];
                const valB = metricsB[d.key as keyof typeof metricsB];
                const maxVal = Math.max(valA, valB);
                return (
                  <div key={d.key} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    <div className="text-right">
                      <div className="h-2 rounded-full bg-muted overflow-hidden flex justify-end">
                        <motion.div
                          className={cn("h-full rounded-full", valA >= valB ? "bg-green-500" : "bg-green-500/50")}
                          initial={{ width: 0 }}
                          animate={{ width: `${(valA / 100) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className={cn("text-xs font-mono mt-1 inline-block", valA > valB ? "text-green-400" : "text-muted-foreground")}>
                        {valA}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-center">{d.label}</span>
                    <div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={cn("h-full rounded-full", valB >= valA ? "bg-blue-500" : "bg-blue-500/50")}
                          initial={{ width: 0 }}
                          animate={{ width: `${(valB / 100) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className={cn("text-xs font-mono mt-1 inline-block", valB > valA ? "text-blue-400" : "text-muted-foreground")}>
                        {valB}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Tactical Advantages */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
          >
            <h3 className="font-semibold mb-4">Key Tactical Advantages</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-green-400 mb-2">{teamAName}</p>
                <ul className="space-y-1">
                  {advantagesA.length > 0 ? advantagesA.map((a) => (
                    <li key={a.key} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      Superior {a.label.toLowerCase()} (+{a.diff})
                    </li>
                  )) : (
                    <li className="text-sm text-muted-foreground">Balanced performance</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-400 mb-2">{teamBName}</p>
                <ul className="space-y-1">
                  {advantagesB.length > 0 ? advantagesB.map((a) => (
                    <li key={a.key} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      Superior {a.label.toLowerCase()} (+{Math.abs(a.diff)})
                    </li>
                  )) : (
                    <li className="text-sm text-muted-foreground">Balanced performance</li>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
