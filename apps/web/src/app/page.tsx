"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  {
    title: "Match Predictions",
    description: "Win/Draw/Loss probabilities powered by Poisson models and 10,000+ Monte Carlo simulations.",
    icon: "⚽",
  },
  {
    title: "Prediction Lab",
    description: "Adjust prediction factor weights in real-time and watch probabilities update instantly.",
    icon: "🧪",
  },
  {
    title: "AI Coach",
    description: "Natural language explanations that tell you why a team is favoured, powered by Amazon Bedrock.",
    icon: "🤖",
  },
  {
    title: "Team Comparison",
    description: "Radar charts comparing attack, defence, passing, pressing, possession, and xG across teams.",
    icon: "📊",
  },
  {
    title: "Match Timeline",
    description: "Simulate matches minute-by-minute and watch probabilities shift with every event.",
    icon: "⏱️",
  },
];

const stats = [
  { label: "Simulations Per Prediction", value: "10,000+" },
  { label: "Prediction Factors", value: "22" },
  { label: "Competitions Covered", value: "8+" },
  { label: "Model Accuracy", value: "72%" },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              AI-Powered{" "}
              <span className="text-primary">Football</span>{" "}
              Analytics
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
              Predict match outcomes with statistical models, Monte Carlo simulation,
              and explainable AI. Understand the why behind every prediction.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Link
              href="/predict"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
            >
              Start Predicting
            </Link>
            <Link
              href="/about"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium transition-colors hover:bg-accent"
            >
              Learn More
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border/40 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Intelligent Football Insights
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              MatchLens combines statistical models with explainable AI to deliver
              transparent, data-driven predictions.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="group relative rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to explore match predictions?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Select any two teams, choose a competition, and let MatchLens run thousands
            of simulations to predict the outcome.
          </p>
          <div className="mt-8">
            <Link
              href="/predict"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              Make Your First Prediction
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
