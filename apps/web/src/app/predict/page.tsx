"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PredictionResult } from "@/lib/types";
import { SquadSection } from "@/components/prediction/squad-section";

const competitions = ["International", "Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Champions League"];

export default function PredictPage() {
  const [competition, setCompetition] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allTeams, setAllTeams] = useState<{ id: string; name: string; competition: string }[]>([]);

  // Fetch teams when competition changes
  useEffect(() => {
    if (!competition) {
      setAllTeams([]);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/teams?competition=${encodeURIComponent(competition)}&page_size=100`)
      .then((res) => res.json())
      .then((data) => {
        if (data.teams) {
          setAllTeams(data.teams.map((t: any) => ({
            id: t.teamId,
            name: t.name,
            competition: t.competition || "International",
          })));
        }
      })
      .catch(() => {
        setAllTeams([]);
      });
  }, [competition]);

  // Teams are already filtered by competition from the API
  const availableTeams = useMemo(() => {
    return allTeams.sort((a, b) => a.name.localeCompare(b.name));
  }, [allTeams]);

  // Reset team selections when competition changes
  const handleCompetitionChange = (comp: string) => {
    setCompetition(comp);
    setHomeTeam("");
    setAwayTeam("");
    setPrediction(null);
  };

  const handlePredict = async () => {
    if (!homeTeam || !awayTeam || !competition) {
      setError("Please select both teams and a competition");
      return;
    }
    if (homeTeam === awayTeam) {
      setError("Please select two different teams");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/predictions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            home_team_id: homeTeam,
            away_team_id: awayTeam,
            competition,
            match_date: matchDate ? matchDate.split("/").reverse().join("-") : new Date().toISOString().split("T")[0],
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Prediction failed");
      }

      const data = await response.json();
      // Map snake_case API response to camelCase frontend types
      setPrediction({
        ...data,
        homeTeam: data.home_team || data.homeTeam,
        awayTeam: data.away_team || data.awayTeam,
        predictionId: data.prediction_id || data.predictionId,
        confidenceScore: data.confidence_score ?? data.confidenceScore,
        expectedGoals: data.expected_goals || data.expectedGoals,
        scorelineMatrix: data.scoreline_matrix || data.scorelineMatrix,
        additionalProbabilities: data.additional_probabilities || data.additionalProbabilities,
        featureImportance: data.feature_importance || data.featureImportance,
        firstGoalscorer: data.first_goalscorer || data.firstGoalscorer,
        mostDangerous: data.most_dangerous || data.mostDangerous,
        createdAt: data.created_at || data.createdAt,
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Match Prediction</h1>
        <p className="mt-2 text-muted-foreground">
          Select two teams and let MatchLens run 10,000 simulations to predict the outcome.
        </p>
      </div>

      {/* Input Section */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Competition (First!) */}
          <div>
            <label className="block text-sm font-medium mb-2">Competition</label>
            <select
              value={competition}
              onChange={(e) => handleCompetitionChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            >
              <option value="">Select competition</option>
              {competitions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Home Team */}
          <div>
            <label className="block text-sm font-medium mb-2">Home Team</label>
            <select
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              disabled={!competition}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm disabled:opacity-50"
            >
              <option value="">{competition ? "Select home team" : "Choose competition first"}</option>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Away Team */}
          <div>
            <label className="block text-sm font-medium mb-2">Away Team</label>
            <select
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              disabled={!competition}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm disabled:opacity-50"
            >
              <option value="">{competition ? "Select away team" : "Choose competition first"}</option>
              {availableTeams.filter((t) => t.id !== homeTeam).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Match Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Match Date</label>
            <input
              type="text"
              value={matchDate}
              onChange={(e) => {
                const val = e.target.value;
                // Auto-format: add slashes as user types
                const digits = val.replace(/\D/g, "");
                let formatted = digits;
                if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
                if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4, 8);
                setMatchDate(formatted);
              }}
              placeholder="DD/MM/YYYY"
              maxLength={10}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}

        <div className="mt-6">
          <button
            onClick={handlePredict}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Running Simulations...
              </span>
            ) : (
              "Predict Match"
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mt-8 space-y-6"
          >
            {/* Probability Header */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">
                  {prediction.homeTeam.name} vs {prediction.awayTeam.name}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Confidence: {prediction.confidenceScore}% • 10,000 simulations
                </p>
              </div>

              {/* Win/Draw/Loss Probabilities */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <ProbCard label={prediction.homeTeam.name} value={prediction.probabilities.homeWin} color="text-green-400" />
                <ProbCard label="Draw" value={prediction.probabilities.draw} color="text-yellow-400" />
                <ProbCard label={prediction.awayTeam.name} value={prediction.probabilities.awayWin} color="text-blue-400" />
              </div>

              {/* Probability Bar */}
              <div className="h-4 rounded-full overflow-hidden flex">
                <div className="bg-green-500 transition-all duration-500" style={{ width: `${prediction.probabilities.homeWin}%` }} />
                <div className="bg-yellow-500 transition-all duration-500" style={{ width: `${prediction.probabilities.draw}%` }} />
                <div className="bg-blue-500 transition-all duration-500" style={{ width: `${prediction.probabilities.awayWin}%` }} />
              </div>
            </div>

            {/* Expected Goals & Additional Stats */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Expected Goals */}
              <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <h3 className="font-semibold mb-4">Expected Goals (xG)</h3>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{prediction.expectedGoals.home}</div>
                    <div className="text-sm text-muted-foreground">{prediction.homeTeam.name}</div>
                  </div>
                  <div className="text-muted-foreground text-lg">vs</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{prediction.expectedGoals.away}</div>
                    <div className="text-sm text-muted-foreground">{prediction.awayTeam.name}</div>
                  </div>
                </div>
              </div>

              {/* Additional Probabilities */}
              <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <h3 className="font-semibold mb-4">Key Probabilities</h3>
                <div className="space-y-3">
                  <StatBar label="BTTS" value={(prediction.additionalProbabilities?.btts ?? 0) * 100} />
                  <StatBar label="Over 2.5" value={(prediction.additionalProbabilities?.over?.["2.5"] ?? 0) * 100} />
                  <StatBar label={`${prediction.homeTeam?.name} CS`} value={(prediction.additionalProbabilities?.clean_sheet_home ?? prediction.additionalProbabilities?.cleanSheetHome ?? 0) * 100} />
                  <StatBar label={`${prediction.awayTeam?.name} CS`} value={(prediction.additionalProbabilities?.clean_sheet_away ?? prediction.additionalProbabilities?.cleanSheetAway ?? 0) * 100} />
                </div>
              </div>
            </div>

            {/* Top Scorelines */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <h3 className="font-semibold mb-2">Most Likely Scorelines</h3>
              <p className="text-xs text-muted-foreground mb-4">{prediction.homeTeam?.name} – {prediction.awayTeam?.name}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {(prediction.scorelines || []).slice(0, 10).map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border/30 px-3 py-2">
                    <span className="font-mono font-semibold">{s.home} – {s.away}</span>
                    <span className="text-sm text-muted-foreground">{s.probability}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Importance */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <h3 className="font-semibold mb-4">Why This Prediction?</h3>
              <div className="space-y-3">
                {(prediction.featureImportance || []).map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={cn("text-sm font-medium w-4", f.contribution >= 0 ? "text-green-400" : "text-red-400")}>
                      {f.contribution >= 0 ? "+" : "−"}
                    </span>
                    <span className="text-sm flex-1">{f.factor}</span>
                    <span className={cn("text-sm font-mono", f.contribution >= 0 ? "text-green-400" : "text-red-400")}>
                      {f.contribution >= 0 ? "+" : ""}{f.contribution.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Explanation */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <h3 className="font-semibold mb-4">AI Analysis</h3>
              <p className="text-muted-foreground leading-relaxed">{prediction.explanation}</p>
              {(prediction.insights || []).length > 0 && (
                <div className="mt-4 space-y-2">
                  {(prediction.insights || []).map((insight, i) => (
                    <p key={i} className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/30">
                      {insight}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Squad & Lineup Section */}
            <SquadSection
              homeTeamId={homeTeam}
              awayTeamId={awayTeam}
              homeTeamName={prediction.homeTeam?.name || ""}
              awayTeamName={prediction.awayTeam?.name || ""}
              competition={competition}
              matchDate={matchDate ? matchDate.split("/").reverse().join("-") : ""}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProbCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={cn("text-3xl font-bold", color)}>{value}%</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </div>
    </div>
  );
}

// Sample squad data — in production, fetched from football-data.org or API-Football
const squadData: Record<string, { name: string; position: string; number: number }[]> = {
  "team-argentina": [
    { name: "E. Martínez", position: "GK", number: 23 },
    { name: "N. Molina", position: "DEF", number: 26 },
    { name: "C. Romero", position: "DEF", number: 13 },
    { name: "N. Otamendi", position: "DEF", number: 19 },
    { name: "N. Tagliafico", position: "DEF", number: 3 },
    { name: "R. De Paul", position: "MID", number: 7 },
    { name: "E. Fernández", position: "MID", number: 24 },
    { name: "A. Mac Allister", position: "MID", number: 20 },
    { name: "L. Messi", position: "FWD", number: 10 },
    { name: "J. Álvarez", position: "FWD", number: 9 },
    { name: "Á. Di María", position: "FWD", number: 11 },
  ],
  "team-france": [
    { name: "M. Maignan", position: "GK", number: 23 },
    { name: "J. Koundé", position: "DEF", number: 5 },
    { name: "D. Upamecano", position: "DEF", number: 4 },
    { name: "W. Saliba", position: "DEF", number: 17 },
    { name: "T. Hernández", position: "DEF", number: 22 },
    { name: "A. Tchouaméni", position: "MID", number: 8 },
    { name: "A. Rabiot", position: "MID", number: 14 },
    { name: "A. Griezmann", position: "MID", number: 7 },
    { name: "O. Dembélé", position: "FWD", number: 11 },
    { name: "K. Mbappé", position: "FWD", number: 10 },
    { name: "M. Thuram", position: "FWD", number: 9 },
  ],
  "team-england": [
    { name: "J. Pickford", position: "GK", number: 1 },
    { name: "K. Walker", position: "DEF", number: 2 },
    { name: "J. Stones", position: "DEF", number: 5 },
    { name: "H. Maguire", position: "DEF", number: 6 },
    { name: "L. Shaw", position: "DEF", number: 3 },
    { name: "D. Rice", position: "MID", number: 4 },
    { name: "J. Bellingham", position: "MID", number: 10 },
    { name: "P. Foden", position: "MID", number: 7 },
    { name: "B. Saka", position: "FWD", number: 17 },
    { name: "H. Kane", position: "FWD", number: 9 },
    { name: "C. Palmer", position: "FWD", number: 20 },
  ],
  "team-arsenal": [
    { name: "D. Raya", position: "GK", number: 22 },
    { name: "B. White", position: "DEF", number: 4 },
    { name: "W. Saliba", position: "DEF", number: 12 },
    { name: "G. Magalhães", position: "DEF", number: 6 },
    { name: "J. Timber", position: "DEF", number: 2 },
    { name: "D. Rice", position: "MID", number: 41 },
    { name: "M. Ødegaard", position: "MID", number: 8 },
    { name: "T. Partey", position: "MID", number: 5 },
    { name: "B. Saka", position: "FWD", number: 7 },
    { name: "K. Havertz", position: "FWD", number: 29 },
    { name: "G. Martinelli", position: "FWD", number: 11 },
  ],
  "team-manchester-city": [
    { name: "Ederson", position: "GK", number: 31 },
    { name: "K. Walker", position: "DEF", number: 2 },
    { name: "R. Dias", position: "DEF", number: 3 },
    { name: "N. Aké", position: "DEF", number: 6 },
    { name: "J. Gvardiol", position: "DEF", number: 24 },
    { name: "Rodri", position: "MID", number: 16 },
    { name: "K. De Bruyne", position: "MID", number: 17 },
    { name: "B. Silva", position: "MID", number: 20 },
    { name: "P. Foden", position: "FWD", number: 47 },
    { name: "E. Haaland", position: "FWD", number: 9 },
    { name: "J. Doku", position: "FWD", number: 11 },
  ],
  "team-real-madrid": [
    { name: "T. Courtois", position: "GK", number: 1 },
    { name: "D. Carvajal", position: "DEF", number: 2 },
    { name: "A. Rüdiger", position: "DEF", number: 22 },
    { name: "É. Militão", position: "DEF", number: 3 },
    { name: "F. Mendy", position: "DEF", number: 23 },
    { name: "A. Tchouaméni", position: "MID", number: 18 },
    { name: "L. Modrić", position: "MID", number: 10 },
    { name: "J. Bellingham", position: "MID", number: 5 },
    { name: "Vinícius Jr", position: "FWD", number: 7 },
    { name: "K. Mbappé", position: "FWD", number: 9 },
    { name: "Rodrygo", position: "FWD", number: 11 },
  ],
  "team-barcelona": [
    { name: "M. ter Stegen", position: "GK", number: 1 },
    { name: "J. Koundé", position: "DEF", number: 23 },
    { name: "R. Araújo", position: "DEF", number: 4 },
    { name: "A. Balde", position: "DEF", number: 3 },
    { name: "Pedri", position: "MID", number: 8 },
    { name: "Gavi", position: "MID", number: 6 },
    { name: "F. de Jong", position: "MID", number: 21 },
    { name: "L. Yamal", position: "FWD", number: 19 },
    { name: "R. Lewandowski", position: "FWD", number: 9 },
    { name: "Raphinha", position: "FWD", number: 11 },
  ],
  "team-liverpool": [
    { name: "Alisson", position: "GK", number: 1 },
    { name: "T. Alexander-Arnold", position: "DEF", number: 66 },
    { name: "V. van Dijk", position: "DEF", number: 4 },
    { name: "A. Robertson", position: "DEF", number: 26 },
    { name: "A. Mac Allister", position: "MID", number: 10 },
    { name: "D. Szoboszlai", position: "MID", number: 8 },
    { name: "R. Gravenberch", position: "MID", number: 38 },
    { name: "M. Salah", position: "FWD", number: 11 },
    { name: "D. Núñez", position: "FWD", number: 9 },
    { name: "L. Díaz", position: "FWD", number: 7 },
  ],
};

function SquadList({ teamId, teamName }: { teamId: string; teamName?: string }) {
  const [players, setPlayers] = useState<{ name: string; position: string; goals?: number; club?: string; caps?: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!teamId && !teamName) return;

    // First check static hardcoded data
    const staticSquad = squadData[teamId];
    if (staticSquad) {
      setPlayers(staticSquad.map(p => ({ name: p.name, position: p.position })));
      setLoaded(true);
      return;
    }

    // Try roster endpoint (World Cup squads) using team name
    if (teamName) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/teams/roster/${encodeURIComponent(teamName)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.available && data.roster && data.roster.length > 0) {
            setPlayers(data.roster.map((p: any) => ({
              name: p.name,
              position: p.position || "MID",
              goals: p.goals,
              club: p.club,
              caps: p.caps,
            })));
            setLoaded(true);
          } else {
            // Fall back to players endpoint
            return fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/players?team_id=${encodeURIComponent(teamId)}&page_size=15`)
              .then((res) => res.json())
              .then((data) => {
                if (data.players && data.players.length > 0) {
                  setPlayers(data.players.map((p: any) => ({
                    name: p.name,
                    position: p.position || "FWD",
                    goals: p.goals,
                  })));
                }
                setLoaded(true);
              });
          }
        })
        .catch(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [teamId, teamName]);

  if (!loaded) {
    return <p className="text-xs text-muted-foreground">Loading squad...</p>;
  }

  if (players.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Squad data not yet available for {teamName || "this team"}. Live lineups appear closer to kickoff via API-Football.
      </p>
    );
  }

  const positions = ["GK", "DEF", "MID", "FWD"];
  const positionLabels: Record<string, string> = { GK: "Goalkeeper", DEF: "Defence", MID: "Midfield", FWD: "Attack" };

  return (
    <div className="space-y-3">
      {positions.map((pos) => {
        const posPlayers = players.filter((p) => p.position === pos);
        if (posPlayers.length === 0) return null;
        return (
          <div key={pos}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              {positionLabels[pos]}
            </div>
            {posPlayers.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-0.5">
                <span>{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {p.club || (p.goals !== undefined && p.goals > 0 ? `${p.goals} goals` : "")}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
