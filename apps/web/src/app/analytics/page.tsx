"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const modelMetrics = [
  { name: "Logistic Regression", accuracy: 68.2, precision: 65.4, recall: 70.1, f1: 67.7, color: "#f59e0b" },
  { name: "Random Forest", accuracy: 70.5, precision: 68.9, recall: 71.3, f1: 70.1, color: "#3b82f6" },
  { name: "XGBoost", accuracy: 72.1, precision: 70.3, recall: 73.2, f1: 71.7, color: "#8b5cf6" },
  { name: "LightGBM", accuracy: 71.8, precision: 69.7, recall: 72.9, f1: 71.3, color: "#ec4899" },
  { name: "Ensemble", accuracy: 73.4, precision: 71.2, recall: 74.1, f1: 72.6, color: "#22c55e" },
];

const accuracyOverTime = [
  { month: "Jan", accuracy: 68 },
  { month: "Feb", accuracy: 69 },
  { month: "Mar", accuracy: 71 },
  { month: "Apr", accuracy: 70 },
  { month: "May", accuracy: 72 },
  { month: "Jun", accuracy: 73 },
  { month: "Jul", accuracy: 73.4 },
];

const calibrationData = [
  { predicted: 10, actual: 12 },
  { predicted: 20, actual: 18 },
  { predicted: 30, actual: 28 },
  { predicted: 40, actual: 38 },
  { predicted: 50, actual: 48 },
  { predicted: 60, actual: 58 },
  { predicted: 70, actual: 72 },
  { predicted: 80, actual: 78 },
  { predicted: 90, actual: 88 },
];

const featureImportanceData = [
  { feature: "Elo Rating", importance: 22 },
  { feature: "Recent Form", importance: 18 },
  { feature: "xG", importance: 15 },
  { feature: "Home Advantage", importance: 12 },
  { feature: "Goals Scored", importance: 10 },
  { feature: "Defence Rating", importance: 9 },
  { feature: "H2H Record", importance: 7 },
  { feature: "Rest Days", importance: 4 },
  { feature: "Manager", importance: 3 },
];

const confusionMatrix = [
  [145, 32, 18],  // Predicted Home Win
  [28, 89, 25],   // Predicted Draw
  [15, 22, 126],  // Predicted Away Win
];

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Model Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Track model accuracy, compare algorithms, and understand feature importance.
        </p>
      </div>

      {/* Model Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {modelMetrics.map((model, i) => (
          <motion.div
            key={model.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm",
              model.name === "Ensemble" && "ring-1 ring-primary/30"
            )}
          >
            <div className="text-xs text-muted-foreground mb-1">{model.name}</div>
            <div className="text-2xl font-bold" style={{ color: model.color }}>{model.accuracy}%</div>
            <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
            <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
              <div>P: {model.precision}%</div>
              <div>R: {model.recall}%</div>
              <div>F1: {model.f1}%</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accuracy Over Time */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h3 className="font-semibold mb-4">Accuracy Over Time</h3>
          <div className="h-[250px]" aria-label="Line chart showing model accuracy improvement from January to July 2026">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis domain={[65, 80]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ fill: "hsl(142, 71%, 45%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calibration Curve */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h3 className="font-semibold mb-4">Calibration Curve</h3>
          <div className="h-[250px]" aria-label="Line chart showing predicted vs actual probability calibration">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calibrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="predicted" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} label={{ value: "Predicted %", position: "bottom", fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} label={{ value: "Actual %", angle: -90, position: "left", fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="actual" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ fill: "hsl(142, 71%, 45%)" }} name="Actual" />
                <Line type="monotone" dataKey="predicted" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Perfect" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Importance */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h3 className="font-semibold mb-4">Feature Importance</h3>
          <div className="h-[300px]" aria-label="Bar chart showing relative importance of prediction factors">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportanceData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis type="category" dataKey="feature" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="importance" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <h3 className="font-semibold mb-4">Confusion Matrix (Ensemble Model)</h3>
          <div className="flex justify-center" aria-label="3x3 confusion matrix showing predicted vs actual outcomes for home win, draw, and away win">
            <div>
              <div className="text-xs text-muted-foreground text-center mb-2">Predicted →</div>
              <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-1">
                <div /> {/* Empty corner */}
                <div className="text-[10px] text-center text-muted-foreground px-2">Home</div>
                <div className="text-[10px] text-center text-muted-foreground px-2">Draw</div>
                <div className="text-[10px] text-center text-muted-foreground px-2">Away</div>

                {["Home", "Draw", "Away"].map((label, row) => (
                  <>
                    <div key={`label-${row}`} className="text-[10px] text-muted-foreground flex items-center pr-2">{label}</div>
                    {confusionMatrix[row].map((val, col) => {
                      const isCorrect = row === col;
                      const maxVal = Math.max(...confusionMatrix.flat());
                      const opacity = val / maxVal;
                      return (
                        <div
                          key={`${row}-${col}`}
                          className={cn(
                            "w-16 h-16 flex items-center justify-center rounded-md text-sm font-mono font-semibold",
                            isCorrect ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-muted/30 text-muted-foreground"
                          )}
                          style={{ opacity: isCorrect ? 1 : 0.5 + opacity * 0.5 }}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-center">↑ Actual</div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="mt-6 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
        <h3 className="font-semibold mb-4">Model Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Model</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Accuracy</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Precision</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recall</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">F1 Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {modelMetrics.map((model) => (
                <tr key={model.name}>
                  <td className="px-4 py-3 font-medium">{model.name}</td>
                  <td className="px-4 py-3 font-mono">{model.accuracy}%</td>
                  <td className="px-4 py-3 font-mono">{model.precision}%</td>
                  <td className="px-4 py-3 font-mono">{model.recall}%</td>
                  <td className="px-4 py-3 font-mono">{model.f1}%</td>
                  <td className="px-4 py-3">
                    {model.name === "Ensemble" ? (
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Primary</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
