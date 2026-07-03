"use client";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">About MatchLens</h1>

      <div className="prose prose-invert max-w-none space-y-6">
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-3">What is MatchLens?</h2>
          <p className="text-muted-foreground leading-relaxed">
            MatchLens is an AI-powered football analytics platform that predicts match outcomes
            using statistical models, Monte Carlo simulation, and explainable AI. It is NOT a
            betting website — it's a tool for football fans, analysts, journalists, and data
            enthusiasts who want to understand the game through data.
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-3">How It Works</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            MatchLens runs thousands of simulated matches using team strength, attacking output,
            defensive stability, and recent form to produce explainable probabilities.
          </p>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Calculate expected goals using Poisson distribution</li>
            <li>2. Run 10,000+ Monte Carlo simulations</li>
            <li>3. Generate win/draw/loss probabilities</li>
            <li>4. Calculate scoreline distributions</li>
            <li>5. Identify key contributing factors</li>
            <li>6. Generate AI explanations via Amazon Bedrock</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-3">Prediction Factors</h2>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <span>• Team Elo Rating</span>
            <span>• FIFA Rankings</span>
            <span>• Recent Form (5 matches)</span>
            <span>• Expected Goals (xG)</span>
            <span>• Goals Scored/Conceded</span>
            <span>• Home/Away Advantage</span>
            <span>• Player Availability</span>
            <span>• Head-to-Head Record</span>
            <span>• Possession & Passing</span>
            <span>• Shots on Target</span>
            <span>• Rest Days</span>
            <span>• Manager History</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-3">Built for AWS Kiro BuildFest</h2>
          <p className="text-muted-foreground leading-relaxed">
            This project showcases Kiro's Spec-Driven Development philosophy — from requirements
            to design to implementation with full traceability. Every feature was specified before
            being built, with clear acceptance criteria and architectural decisions documented.
          </p>
        </div>
      </div>
    </div>
  );
}
