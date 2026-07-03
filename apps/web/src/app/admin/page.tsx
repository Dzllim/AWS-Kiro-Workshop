"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const dataSources = [
  { name: "OpenFootball", status: "healthy", lastRefresh: "2026-07-03 06:00" },
  { name: "ClubElo", status: "healthy", lastRefresh: "2026-07-03 06:00" },
  { name: "football-data.org", status: "healthy", lastRefresh: "2026-07-03 06:00" },
  { name: "Kaggle Historical", status: "healthy", lastRefresh: "2026-07-01 00:00" },
];

const recentLogs = [
  { timestamp: "2026-07-03 06:01:23", level: "info", message: "Data pipeline completed successfully" },
  { timestamp: "2026-07-03 06:00:45", level: "info", message: "ClubElo ratings updated: 120 teams" },
  { timestamp: "2026-07-03 06:00:12", level: "info", message: "OpenFootball sync: 15 new matches" },
  { timestamp: "2026-07-02 18:30:00", level: "warn", message: "football-data.org rate limit hit, retry succeeded" },
  { timestamp: "2026-07-02 12:00:00", level: "info", message: "Model ensemble_v1 metrics: accuracy=73.4%" },
  { timestamp: "2026-07-01 06:00:00", level: "info", message: "Scheduled data refresh completed" },
];

export default function AdminPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [retraining, setRetraining] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 3000);
  };

  const handleRetrain = async () => {
    setRetraining(true);
    // Simulate API call
    setTimeout(() => setRetraining(false), 5000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage data sources, model training, and system monitoring.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Data Sources */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Data Sources</h3>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
            >
              {refreshing ? "Refreshing..." : "Refresh All"}
            </button>
          </div>
          <div className="space-y-3">
            {dataSources.map((source) => (
              <div key={source.name} className="flex items-center justify-between rounded-lg border border-border/30 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    source.status === "healthy" ? "bg-green-400" : "bg-red-400"
                  )} />
                  <span className="text-sm font-medium">{source.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{source.lastRefresh}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Model Info */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Model Management</h3>
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
            >
              {retraining ? "Training..." : "Retrain Models"}
            </button>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-border/30 p-4">
              <div className="text-sm text-muted-foreground">Current Model Version</div>
              <div className="text-lg font-mono font-semibold mt-1">ensemble_v1_20260703</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/30 p-3 text-center">
                <div className="text-xs text-muted-foreground">Accuracy</div>
                <div className="text-xl font-bold text-primary">73.4%</div>
              </div>
              <div className="rounded-lg border border-border/30 p-3 text-center">
                <div className="text-xs text-muted-foreground">Training Split</div>
                <div className="text-xl font-bold">80/20</div>
              </div>
            </div>
            <div className="rounded-lg border border-border/30 p-3">
              <div className="text-xs text-muted-foreground">Last Trained</div>
              <div className="text-sm font-medium mt-1">2026-07-03 06:05:00 UTC</div>
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h3 className="font-semibold mb-4">Recent System Logs</h3>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {recentLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-sm py-1.5">
                <span className="font-mono text-xs text-muted-foreground min-w-[140px]">{log.timestamp}</span>
                <span className={cn(
                  "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase min-w-[40px] justify-center",
                  log.level === "info" && "bg-primary/10 text-primary",
                  log.level === "warn" && "bg-yellow-500/10 text-yellow-400",
                  log.level === "error" && "bg-red-500/10 text-red-400",
                )}>
                  {log.level}
                </span>
                <span className="text-muted-foreground">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
