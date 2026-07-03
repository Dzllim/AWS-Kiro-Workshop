"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Link href="/predict" className="group rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
          <div className="text-2xl mb-3">⚽</div>
          <h3 className="font-semibold group-hover:text-primary transition-colors">New Prediction</h3>
          <p className="text-sm text-muted-foreground mt-1">Generate a match prediction with AI analysis</p>
        </Link>

        <Link href="/lab" className="group rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
          <div className="text-2xl mb-3">🧪</div>
          <h3 className="font-semibold group-hover:text-primary transition-colors">Prediction Lab</h3>
          <p className="text-sm text-muted-foreground mt-1">Customize factor weights interactively</p>
        </Link>

        <Link href="/compare" className="group rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
          <div className="text-2xl mb-3">📊</div>
          <h3 className="font-semibold group-hover:text-primary transition-colors">Compare Teams</h3>
          <p className="text-sm text-muted-foreground mt-1">Radar chart comparison across 6 dimensions</p>
        </Link>

        <Link href="/simulate" className="group rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
          <div className="text-2xl mb-3">⏱️</div>
          <h3 className="font-semibold group-hover:text-primary transition-colors">Match Simulator</h3>
          <p className="text-sm text-muted-foreground mt-1">Watch a match unfold minute by minute</p>
        </Link>

        <Link href="/explorer" className="group rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
          <div className="text-2xl mb-3">🔍</div>
          <h3 className="font-semibold group-hover:text-primary transition-colors">Match Explorer</h3>
          <p className="text-sm text-muted-foreground mt-1">Search historical matches and trends</p>
        </Link>

        <Link href="/analytics" className="group rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
          <div className="text-2xl mb-3">📈</div>
          <h3 className="font-semibold group-hover:text-primary transition-colors">Model Analytics</h3>
          <p className="text-sm text-muted-foreground mt-1">Track model accuracy and performance</p>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="mt-12 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-center">
          <div className="text-2xl font-bold text-primary">10,000</div>
          <div className="text-xs text-muted-foreground mt-1">Simulations/Prediction</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-center">
          <div className="text-2xl font-bold text-primary">73.4%</div>
          <div className="text-xs text-muted-foreground mt-1">Model Accuracy</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-center">
          <div className="text-2xl font-bold text-primary">22</div>
          <div className="text-xs text-muted-foreground mt-1">Prediction Factors</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-center">
          <div className="text-2xl font-bold text-primary">8+</div>
          <div className="text-xs text-muted-foreground mt-1">Competitions</div>
        </div>
      </div>
    </div>
  );
}
