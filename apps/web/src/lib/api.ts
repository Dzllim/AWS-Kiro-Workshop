// API client for MatchLens backend
import type { PredictionRequest, PredictionResult, Team, Player, WhatIfResult, WhatIfScenario, TimelineSimulation } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string) {
    return this.request<{ userId: string; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: { userId: string; email: string; role: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // Predictions
  async predict(request: PredictionRequest): Promise<PredictionResult> {
    return this.request<PredictionResult>("/predictions", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async predictLab(request: PredictionRequest): Promise<PredictionResult> {
    return this.request<PredictionResult>("/predictions/lab", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async whatIf(predictionId: string, scenarios: WhatIfScenario[]): Promise<WhatIfResult> {
    return this.request<WhatIfResult>("/predictions/what-if", {
      method: "POST",
      body: JSON.stringify({ predictionId, scenarios }),
    });
  }

  async savePrediction(predictionId: string) {
    return this.request<{ saved: boolean }>(`/predictions/${predictionId}/save`, {
      method: "POST",
    });
  }

  async getPredictionHistory(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<{ predictions: any[]; pagination: any; accuracyStats: any }>(`/predictions/history${query}`);
  }

  // Teams
  async getTeams(params?: Record<string, string>): Promise<{ teams: Team[]; pagination: any }> {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request(`/teams${query}`);
  }

  async getTeam(teamId: string): Promise<Team> {
    return this.request(`/teams/${teamId}`);
  }

  async compareTeams(teamA: string, teamB: string) {
    return this.request<any>(`/teams/compare?teamA=${teamA}&teamB=${teamB}`);
  }

  // Players
  async getPlayers(params?: Record<string, string>): Promise<{ players: Player[]; pagination: any }> {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request(`/players${query}`);
  }

  async getPlayer(playerId: string): Promise<Player> {
    return this.request(`/players/${playerId}`);
  }

  // Simulations
  async startTimeline(homeTeamId: string, awayTeamId: string, competition: string, speed: number): Promise<TimelineSimulation> {
    return this.request("/simulations/timeline", {
      method: "POST",
      body: JSON.stringify({ homeTeamId, awayTeamId, competition, speed }),
    });
  }

  async injectEvent(simulationId: string, event: { minute: number; type: string; team: string }) {
    return this.request<any>("/simulations/live-event", {
      method: "POST",
      body: JSON.stringify({ simulationId, event }),
    });
  }

  // AI
  async getExplanation(predictionId: string) {
    return this.request<{ explanation: string; topFactors: any[] }>("/ai/explain", {
      method: "POST",
      body: JSON.stringify({ predictionId }),
    });
  }

  async askCoach(predictionId: string, question: string) {
    return this.request<{ answer: string; referencedFactors: string[] }>("/ai/ask", {
      method: "POST",
      body: JSON.stringify({ predictionId, question }),
    });
  }

  // Models
  async getModelMetrics() {
    return this.request<any>("/models/metrics");
  }
}

export const api = new ApiClient();
