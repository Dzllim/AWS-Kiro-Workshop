// Core domain types for MatchLens

export interface Team {
  teamId: string;
  name: string;
  country: string;
  competition: string;
  eloRating: number;
  fifaRanking?: number;
  attackStrength: number;
  defenceStrength: number;
  form: ("W" | "D" | "L")[];
  goalsScored: number;
  goalsConceded: number;
  matchesPlayed: number;
  xGFor: number;
  xGAgainst: number;
  possession: number;
  passAccuracy: number;
  shotsPerMatch: number;
  pressingIntensity: number;
}

export interface Player {
  playerId: string;
  teamId: string;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  shotsPerMatch: number;
  keyPasses: number;
  form: number;
  marketValue: number;
  minutesPlayed: number;
  available: boolean;
  injuryStatus?: string;
}

export interface PredictionRequest {
  homeTeamId: string;
  awayTeamId: string;
  competition: string;
  matchDate: string;
  weights?: Record<string, number>;
}

export interface Scoreline {
  home: number;
  away: number;
  probability: number;
}

export interface FeatureContribution {
  factor: string;
  contribution: number;
}

export interface AdditionalProbabilities {
  cleanSheetHome: number;
  cleanSheetAway: number;
  btts: number;
  over: Record<string, number>;
  under: Record<string, number>;
}

export interface PredictionResult {
  predictionId: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  expectedGoals: { home: number; away: number };
  confidenceScore: number;
  scorelines: Scoreline[];
  scorelineMatrix: number[][];
  additionalProbabilities: AdditionalProbabilities;
  featureImportance: FeatureContribution[];
  firstGoalscorer?: { playerId: string; name: string; probability: number };
  mostDangerous?: { playerId: string; name: string; dangerRating: number };
  explanation: string;
  insights: string[];
  createdAt: string;
}

export interface WhatIfScenario {
  type: "player_injury" | "red_card" | "weather" | "venue_change";
  playerId?: string;
  team?: "home" | "away";
  minute?: number;
  condition?: string;
  neutral?: boolean;
}

export interface WhatIfResult {
  baseline: { homeWin: number; draw: number; awayWin: number };
  adjusted: { homeWin: number; draw: number; awayWin: number };
  differences: { homeWin: number; draw: number; awayWin: number };
  scenariosApplied: number;
  explanation: string;
}

export interface SimulationEvent {
  minute: number;
  type: "goal" | "red_card" | "yellow_card" | "injury" | "substitution";
  team: "home" | "away";
  player?: string;
  probabilities: { homeWin: number; draw: number; awayWin: number };
}

export interface TimelineSimulation {
  simulationId: string;
  events: SimulationEvent[];
  finalScore: { home: number; away: number };
  finalProbabilities: { homeWin: number; draw: number; awayWin: number };
}

export interface ModelMetrics {
  modelId: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
}

export interface User {
  userId: string;
  email: string;
  role: "user" | "admin";
  favouriteTeams: string[];
  darkMode: boolean;
}

export interface PredictionHistory {
  predictionId: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchDate: string;
  predictedWinner: string;
  actualResult?: { home: number; away: number };
  accuracyStatus: "correct" | "partial" | "incorrect" | "pending";
  createdAt: string;
}
