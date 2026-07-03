"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Sample prediction history
const sampleHistory = [
  { id: "1", homeTeam: "Argentina", awayTeam: "France", competition: "International", matchDate: "2025-11-20", predictedScore: "2-1", actualScore: "3-2", predictedWinner: "home", actualWinner: "home", status: "partial" as const, createdAt: "2025-11-18" },
  { id: "2", homeTeam: "Arsenal", awayTeam: "Chelsea", competition: "Premier League", matchDate: "2025-12-20", predictedScore: "2-0", actualScore: "3-1", predictedWinner: "home", actualWinner: "home", status: "partial" as const, createdAt: "2025-12-18" },
  { id: "3", homeTeam: "Real Madrid", awayTeam: "Barcelona", competition: "La Liga", matchDate: "2025-10-28", predictedScore: "2-1", actualScore: "2-1", predictedWinner: "home", actualWinner: "home", status: "correct" as const, createdAt: "2025-10-26" },
  { id: "4", homeTeam: "Manchester City", awayTeam: "Liverpool", competition: "Premier League", matchDate: "2025-11-30", predictedScore: "2-0", actualScore: "2-2", predictedWinner: "home", actualWinner: "draw", status: "incorrect" as const, createdAt: "2025-11-28" },
  { id: "5", homeTeam: "Bayern Munich", awayTeam: "Dortmund", competition: "Bundesliga", matchDate: "2025-11-09", predictedScore: "3-1", actualScore: "4-1", predictedWinner: "home", actualWinner: "home", status: "partial" as const, createdAt: "2025-11-07" },
  { id: "6", homeTeam: "England", awayTeam: "Spain", competition: "International", matchDate: "2026-08-20", predictedScore: "1-1", actualScore: null, predictedWinner: "draw", actualWinner: null, status: "pending" as const, createdAt: "2026-07-03" },
];

type Status = "correct" | "partial" | "incorrect" | "pending";

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  correct: { label: "Correct", color: "text-green-400", bg: "bg-green-500/10" },
  partial: { label: "Partial", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  incorrect: { label: "Incorrect", color: "text-red-400", bg: "bg-red-500/10" },
  pending: { label: "Pending", color: "text-muted-foreground", bg: "bg-muted" },
};

export default function HistoryPage() {
  const [filter, setFilter] = useState<Status | "all">("all");

  const filteredHistory = filter === "all"
    ? sampleHistory
    : sampleHistory.filter((p) => p.status === filter);

  // Calculate accuracy (Req 14.3)
  const withResults = sampleHistory.filter((p) => p.status !== "pending");
  const correctOrPartial = withResults.filter((p) => p.status === "correct" || p.status === "partial");
  const accuracy = withResults.length > 0 ? (correctOrPartial.length / withResults.length * 100).toFixed(1) : "—";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Prediction History</h1>
          <p className="mt-2 text-muted-foreground">Track your predictions against actual results.</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Running Accuracy</div>
          <div className="text-3xl font-bold text-primary">{accuracy}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "correct", "partial", "incorrect", "pending"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === s ? "bg-primary/10 text-primary border border-primary/30" : "border border-border hover:bg-accent"
            )}
          >
            {s === "all" ? "All" : statusConfig[s].label}
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card/50 p-12 text-center backdrop-blur-sm">
            <p className="text-muted-foreground">
              {filter === "all" ? "No predictions saved yet." : `No predictions with status "${filter}".`}
            </p>
          </div>
        ) : (
          filteredHistory.map((prediction) => (
            <div
              key={prediction.id}
              className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {/* Status badge */}
                <span className={cn(
                  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
                  statusConfig[prediction.status].bg,
                  statusConfig[prediction.status].color,
                )}>
                  {statusConfig[prediction.status].label}
                </span>

                {/* Match info */}
                <div>
                  <div className="font-medium text-sm">
                    {prediction.homeTeam} vs {prediction.awayTeam}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {prediction.competition} • {prediction.matchDate}
                  </div>
                </div>
              </div>

              {/* Scores */}
              <div className="text-right">
                <div className="text-sm">
                  <span className="text-muted-foreground">Predicted: </span>
                  <span className="font-mono font-semibold">{prediction.predictedScore}</span>
                </div>
                {prediction.actualScore && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Actual: </span>
                    <span className="font-mono font-semibold text-primary">{prediction.actualScore}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
