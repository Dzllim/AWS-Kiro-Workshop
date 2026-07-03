"""Main prediction engine orchestrator.

Combines Poisson model, Monte Carlo simulation, Elo ratings,
and feature importance into a unified prediction pipeline.

Implements: Req 1, 2, 3, 9, 10, 11, 22
"""
import json
import os
import random
import uuid
from typing import Optional

from poisson import calculate_match_xg, DEFAULT_BASE_RATE
from monte_carlo import run_simulation
from elo import elo_win_probability

SAMPLE_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "sample")

# Default weights for prediction factors
DEFAULT_WEIGHTS = {
    "eloRating": 75,
    "recentForm": 80,
    "headToHead": 50,
    "xG": 70,
    "homeAdvantage": 65,
    "playerAvailability": 60,
    "restDays": 40,
    "managerHistory": 30,
}


class PredictionEngine:
    """Core prediction engine combining all models."""

    def __init__(self):
        self._teams: dict[str, dict] = {}
        self._players: dict[str, list[dict]] = {}
        self._load_data()

    def _load_data(self):
        """Load team and player data."""
        try:
            teams_path = os.path.join(SAMPLE_DATA_PATH, "teams.json")
            if os.path.exists(teams_path):
                with open(teams_path, "r") as f:
                    teams = json.load(f)
                    for team in teams:
                        self._teams[team["teamId"]] = team

            players_path = os.path.join(SAMPLE_DATA_PATH, "players.json")
            if os.path.exists(players_path):
                with open(players_path, "r") as f:
                    players = json.load(f)
                    for player in players:
                        tid = player["teamId"]
                        if tid not in self._players:
                            self._players[tid] = []
                        self._players[tid].append(player)
        except Exception:
            pass

    def predict(
        self,
        home_team_id: str,
        away_team_id: str,
        competition: str,
        weights: Optional[dict[str, int]] = None,
    ) -> dict:
        """Generate full match prediction.

        Args:
            home_team_id: Home team identifier
            away_team_id: Away team identifier
            competition: Competition name
            weights: Optional custom weights for Prediction Lab

        Returns:
            Complete prediction result dict
        """
        home_team = self._teams.get(home_team_id)
        away_team = self._teams.get(away_team_id)

        # If team not found by ID, try matching by name from the ID
        if not home_team:
            home_team = self._find_team_by_name(home_team_id)
        if not away_team:
            away_team = self._find_team_by_name(away_team_id)

        # Generate default profile for unknown teams (club teams without data)
        if not home_team:
            home_team = self._default_team(home_team_id)
        if not away_team:
            away_team = self._default_team(away_team_id)

        # Normalize weights (Req 3.5, Property 6)
        active_weights = self._normalize_weights(weights or DEFAULT_WEIGHTS)

        # Calculate expected goals using Poisson model (Req 2.4, 2.5)
        # attack_strength: higher = more goals scored. Normalize so avg team ≈ 1.0
        # defence_weakness: higher = more goals conceded by that team
        home_attack = home_team.get("attackStrength", 50) / 70.0  # 70 is roughly average top team
        away_attack = away_team.get("attackStrength", 50) / 70.0
        # Defence weakness = how many goals the defending team concedes relative to average
        # Low defenceStrength = concedes more (higher weakness)
        home_defence_weakness = (120 - home_team.get("defenceStrength", 50)) / 70.0
        away_defence_weakness = (120 - away_team.get("defenceStrength", 50)) / 70.0

        # Elo-based quality adjustment: suppress weaker team's xG when gap is large
        home_elo = home_team.get("eloRating", 1500)
        away_elo = away_team.get("eloRating", 1500)
        elo_diff = home_elo - away_elo  # positive = home is stronger

        # Apply Elo suppression: for every 100 Elo points of difference,
        # reduce the weaker team's effective attack by ~15%
        if elo_diff > 0:
            # Home is stronger — suppress away attack
            away_suppression = max(0.3, 1.0 - (elo_diff / 800.0))
            away_attack *= away_suppression
        elif elo_diff < 0:
            # Away is stronger — suppress home attack
            home_suppression = max(0.3, 1.0 - (abs(elo_diff) / 800.0))
            home_attack *= home_suppression

        # Apply weight influence on home advantage
        home_adv_weight = active_weights.get("homeAdvantage", 0.125)
        home_advantage = 0.15 * (home_adv_weight / 0.125)  # Scale from default

        home_xg, away_xg = calculate_match_xg(
            home_attack=home_attack,
            home_defence=home_defence_weakness,
            away_attack=away_attack,
            away_defence=away_defence_weakness,
            base_rate=DEFAULT_BASE_RATE,
            home_advantage=home_advantage * 0.3,
        )

        # Apply form adjustment
        form_weight = active_weights.get("recentForm", 0.125)
        home_form_factor = self._calculate_form_factor(home_team.get("form", []))
        away_form_factor = self._calculate_form_factor(away_team.get("form", []))
        home_xg *= (1 + (home_form_factor - 0.5) * form_weight * 2)
        away_xg *= (1 + (away_form_factor - 0.5) * form_weight * 2)

        # Clamp xG to realistic range
        home_xg = round(max(0.6, min(3.0, home_xg)), 2)
        away_xg = round(max(0.5, min(2.6, away_xg)), 2)

        # Run Monte Carlo simulation (Req 2.1)
        simulation = run_simulation(home_xg, away_xg, num_simulations=10000)

        # Calculate confidence score (Property 7)
        confidence = self._calculate_confidence(home_team, away_team)

        # Feature importance (Req 4.4, 9)
        feature_importance = self._calculate_feature_importance(
            home_team, away_team, active_weights
        )

        # Player insights (Req 7.2, 7.3)
        first_goalscorer = self._find_first_goalscorer(home_team_id, away_team_id)
        most_dangerous = self._find_most_dangerous(home_team_id, away_team_id)

        # Build response
        return {
            "prediction_id": str(uuid.uuid4()),
            "home_team": {"id": home_team_id, "name": home_team["name"]},
            "away_team": {"id": away_team_id, "name": away_team["name"]},
            "probabilities": simulation["probabilities"],
            "expected_goals": {"home": home_xg, "away": away_xg},
            "confidence_score": confidence,
            "scorelines": simulation["scorelines"],
            "scoreline_matrix": simulation["scoreline_matrix"],
            "additional_probabilities": simulation["additional_probabilities"],
            "feature_importance": feature_importance,
            "first_goalscorer": first_goalscorer,
            "most_dangerous": most_dangerous,
            "explanation": self._generate_template_explanation(
                home_team, away_team, simulation["probabilities"], feature_importance
            ),
            "insights": self._generate_insights(home_team, away_team),
        }

    def predict_with_scenarios(
        self,
        home_team_id: str,
        away_team_id: str,
        competition: str,
        scenarios: list[dict],
    ) -> dict:
        """Re-run prediction with what-if scenario adjustments. (Req 9)"""
        # For now, apply simple adjustments based on scenario type
        result = self.predict(home_team_id, away_team_id, competition)

        for scenario in scenarios:
            s_type = scenario.get("type", "")
            team = scenario.get("team", "home")

            if s_type == "player_injury":
                # Reduce attacking power by 5-10%
                if team == "home":
                    result["probabilities"]["homeWin"] -= 3.0
                    result["probabilities"]["awayWin"] += 2.0
                    result["probabilities"]["draw"] += 1.0
                else:
                    result["probabilities"]["awayWin"] -= 3.0
                    result["probabilities"]["homeWin"] += 2.0
                    result["probabilities"]["draw"] += 1.0

            elif s_type == "red_card":
                # Significant impact
                if team == "home":
                    result["probabilities"]["homeWin"] -= 8.0
                    result["probabilities"]["awayWin"] += 5.0
                    result["probabilities"]["draw"] += 3.0
                else:
                    result["probabilities"]["awayWin"] -= 8.0
                    result["probabilities"]["homeWin"] += 5.0
                    result["probabilities"]["draw"] += 3.0

            elif s_type == "weather":
                # Slight leveling effect
                result["probabilities"]["draw"] += 2.0
                result["probabilities"]["homeWin"] -= 1.0
                result["probabilities"]["awayWin"] -= 1.0

            elif s_type == "venue_change":
                # Remove home advantage
                result["probabilities"]["homeWin"] -= 4.0
                result["probabilities"]["awayWin"] += 2.5
                result["probabilities"]["draw"] += 1.5

        # Normalize to ensure sum = 100
        total = sum(result["probabilities"].values())
        for key in result["probabilities"]:
            result["probabilities"][key] = round(result["probabilities"][key] / total * 100, 1)

        return result

    def simulate_timeline(self, home_team_id: str, away_team_id: str) -> dict:
        """Generate a minute-by-minute match simulation. (Req 10)"""
        home_team = self._teams.get(home_team_id, {"name": "Home"})
        away_team = self._teams.get(away_team_id, {"name": "Away"})

        events = []
        home_goals = 0
        away_goals = 0

        # Simulate events based on team strength
        home_goal_prob = home_team.get("xGFor", 1.5) / 90.0
        away_goal_prob = away_team.get("xGFor", 1.2) / 90.0

        for minute in range(1, 96):  # 90 + 5 stoppage
            # Goals
            if random.random() < home_goal_prob:
                home_goals += 1
                events.append({
                    "minute": minute,
                    "type": "goal",
                    "team": "home",
                    "player": "Home Player",
                    "probabilities": self._calculate_live_probs(home_goals, away_goals, minute),
                })
            elif random.random() < away_goal_prob:
                away_goals += 1
                events.append({
                    "minute": minute,
                    "type": "goal",
                    "team": "away",
                    "player": "Away Player",
                    "probabilities": self._calculate_live_probs(home_goals, away_goals, minute),
                })

            # Cards (lower probability)
            if random.random() < 0.005:
                team = "home" if random.random() < 0.5 else "away"
                events.append({
                    "minute": minute,
                    "type": "yellow_card",
                    "team": team,
                    "player": f"{team.title()} Player",
                    "probabilities": self._calculate_live_probs(home_goals, away_goals, minute),
                })

        final_probs = self._calculate_live_probs(home_goals, away_goals, 90)

        return {
            "simulationId": str(uuid.uuid4()),
            "events": events,
            "finalScore": {"home": home_goals, "away": away_goals},
            "finalProbabilities": final_probs,
        }

    def calculate_live_event_impact(self, event: dict) -> dict:
        """Calculate probability impact of a live event. (Req 22)"""
        # Simple model: goals shift probabilities significantly
        event_type = event.get("type", "goal")
        team = event.get("team", "home")
        minute = event.get("minute", 45)

        # Base shift depends on event type and time remaining
        time_factor = (90 - minute) / 90.0  # More time = less decisive

        if event_type == "goal":
            shift = 15.0 * time_factor
        elif event_type == "red_card":
            shift = 10.0 * time_factor
        else:
            shift = 2.0 * time_factor

        if team == "home":
            return {
                "updatedProbabilities": {
                    "homeWin": round(50 + shift, 1),
                    "draw": round(25 - shift * 0.3, 1),
                    "awayWin": round(25 - shift * 0.7, 1),
                },
                "updatedXG": {"home": 1.5, "away": 1.0},
            }
        else:
            return {
                "updatedProbabilities": {
                    "homeWin": round(25 - shift * 0.7, 1),
                    "draw": round(25 - shift * 0.3, 1),
                    "awayWin": round(50 + shift, 1),
                },
                "updatedXG": {"home": 1.0, "away": 1.5},
            }

    def _normalize_weights(self, weights: dict[str, int]) -> dict[str, float]:
        """Normalize weights to sum to 1.0. (Req 3.5, Property 6)"""
        total = sum(weights.values())
        if total == 0:
            # Equal weights if all zero (Req 3.6)
            n = len(weights)
            return {k: 1.0 / n for k in weights}
        return {k: v / total for k, v in weights.items()}

    def _find_team_by_name(self, team_id: str) -> Optional[dict]:
        """Try to find a team by parsing the name from the ID."""
        # Convert "team-manchester-city" to "Manchester City" and search
        name_guess = team_id.replace("team-", "").replace("-", " ").title()
        for team in self._teams.values():
            if team["name"].lower() == name_guess.lower():
                return team
        return None

    def _default_team(self, team_id: str) -> dict:
        """Generate a default team profile for teams not in our dataset."""
        name = team_id.replace("team-", "").replace("-", " ").title()
        return {
            "teamId": team_id,
            "name": name,
            "country": name,
            "competition": "Unknown",
            "eloRating": 1700,
            "attackStrength": 70,
            "defenceStrength": 70,
            "form": ["W", "D", "W", "L", "W"],
            "goalsScored": 30,
            "goalsConceded": 25,
            "matchesPlayed": 20,
            "xGFor": 1.5,
            "xGAgainst": 1.2,
            "possession": 52,
            "passAccuracy": 80,
            "shotsPerMatch": 12,
            "pressingIntensity": 65,
        }

    def _calculate_form_factor(self, form: list[str]) -> float:
        """Calculate form factor (0.0 - 1.0) from recent results."""
        if not form:
            return 0.5
        points = {"W": 1.0, "D": 0.5, "L": 0.0}
        return sum(points.get(r, 0.5) for r in form[-5:]) / min(len(form), 5)

    def _calculate_confidence(self, home_team: dict, away_team: dict) -> int:
        """Calculate confidence score. (Req 1.3, Property 7)"""
        base = 65
        # More data = higher confidence
        if home_team.get("matchesPlayed", 0) > 20:
            base += 5
        if away_team.get("matchesPlayed", 0) > 20:
            base += 5
        # Cap at 95 (Property 7)
        return min(95, max(0, base + random.randint(-5, 10)))

    def _calculate_feature_importance(
        self, home_team: dict, away_team: dict, weights: dict[str, float]
    ) -> list[dict]:
        """Calculate per-prediction feature contributions. (Req 4.4)"""
        factors = []

        # Elo difference
        elo_diff = home_team.get("eloRating", 1500) - away_team.get("eloRating", 1500)
        factors.append({"factor": "Elo Rating", "contribution": round(elo_diff / 50 * weights.get("eloRating", 0.1) * 100, 1)})

        # Form
        home_form = self._calculate_form_factor(home_team.get("form", []))
        away_form = self._calculate_form_factor(away_team.get("form", []))
        form_diff = (home_form - away_form) * 100
        factors.append({"factor": "Recent Form", "contribution": round(form_diff * weights.get("recentForm", 0.1), 1)})

        # Attack strength
        atk_diff = home_team.get("attackStrength", 50) - away_team.get("attackStrength", 50)
        factors.append({"factor": "Attacking Strength", "contribution": round(atk_diff * weights.get("xG", 0.1) * 0.5, 1)})

        # Home advantage
        factors.append({"factor": "Home Advantage", "contribution": round(12.0 * weights.get("homeAdvantage", 0.1) * 8, 1)})

        # Defence
        def_diff = home_team.get("defenceStrength", 50) - away_team.get("defenceStrength", 50)
        factors.append({"factor": "Defensive Record", "contribution": round(def_diff * weights.get("eloRating", 0.1) * 0.3, 1)})

        # Sort by absolute contribution, return top 5
        factors.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        return factors[:5]

    def _find_first_goalscorer(self, home_team_id: str, away_team_id: str) -> Optional[dict]:
        """Find most likely first goalscorer. (Req 7.2)"""
        all_players = self._players.get(home_team_id, []) + self._players.get(away_team_id, [])
        forwards = [p for p in all_players if p.get("position") in ("FWD", "MID") and p.get("available", True)]

        if not forwards:
            return None

        # Score based on xG and form
        best = max(forwards, key=lambda p: p.get("xG", 0) * (p.get("form", 5) / 10))
        return {
            "player_id": best["playerId"],
            "name": best["name"],
            "probability": round(min(25.0, best.get("xG", 0.3) * 20 + best.get("form", 5)), 1),
        }

    def _find_most_dangerous(self, home_team_id: str, away_team_id: str) -> Optional[dict]:
        """Find most dangerous player. (Req 7.3)"""
        all_players = self._players.get(home_team_id, []) + self._players.get(away_team_id, [])
        if not all_players:
            return None

        best = max(all_players, key=lambda p: p.get("xG", 0) + p.get("shotsPerMatch", 0) * 0.3 + p.get("keyPasses", 0) * 0.2)
        danger = round(min(10.0, best.get("xG", 0) * 3 + best.get("shotsPerMatch", 0) + best.get("form", 5) * 0.5), 1)
        return {
            "player_id": best["playerId"],
            "name": best["name"],
            "danger_rating": danger,
        }

    def _generate_template_explanation(
        self, home: dict, away: dict, probs: dict, importance: list[dict]
    ) -> str:
        """Generate template-based explanation. (Req 4.1)"""
        favoured = home["name"] if probs["homeWin"] > probs["awayWin"] else away["name"]
        top_factors = [f["factor"] for f in importance[:3]]

        return (
            f"{favoured} are favoured in this matchup. The key contributing factors are "
            f"{top_factors[0].lower()}, {top_factors[1].lower()}, and {top_factors[2].lower()}. "
            f"The model assigns a {probs['homeWin']}% chance of a home win, "
            f"{probs['draw']}% chance of a draw, and {probs['awayWin']}% chance of an away win."
        )

    def _generate_insights(self, home: dict, away: dict) -> list[str]:
        """Generate data-supported insights relative to the matchup. (Req 21)"""
        insights = []

        home_name = home["name"]
        away_name = away["name"]
        home_elo = home.get("eloRating", 1500)
        away_elo = away.get("eloRating", 1500)
        elo_diff = abs(home_elo - away_elo)

        # Elo gap insight
        if elo_diff > 200:
            stronger = home_name if home_elo > away_elo else away_name
            weaker = away_name if home_elo > away_elo else home_name
            insights.append(f"{stronger} have a significant Elo advantage ({elo_diff:.0f} points higher), suggesting a clear quality gap over {weaker}.")
        elif elo_diff > 100:
            stronger = home_name if home_elo > away_elo else away_name
            insights.append(f"{stronger} hold a moderate Elo advantage of {elo_diff:.0f} points in this matchup.")

        # Form comparison
        home_form = home.get("form", [])
        away_form = away.get("form", [])
        home_wins = home_form[-5:].count("W") if home_form else 0
        away_wins = away_form[-5:].count("W") if away_form else 0

        if home_wins >= 4:
            insights.append(f"{home_name} are in excellent form, winning {home_wins} of their last 5 matches.")
        elif away_wins >= 4:
            insights.append(f"{away_name} are in excellent form, winning {away_wins} of their last 5 matches.")

        # Defence vs attack matchup insight
        home_attack = home.get("attackStrength", 50)
        away_defence = away.get("defenceStrength", 50)
        away_attack = away.get("attackStrength", 50)
        home_defence = home.get("defenceStrength", 50)

        if home_attack > away_defence + 15:
            insights.append(f"{home_name}'s attacking quality ({home_attack}) significantly outmatches {away_name}'s defensive rating ({away_defence}).")
        elif away_attack > home_defence + 15:
            insights.append(f"{away_name}'s attacking quality ({away_attack}) significantly outmatches {home_name}'s defensive rating ({home_defence}).")

        # Goals context relative to opposition
        if home.get("matchesPlayed", 0) > 0 and away.get("matchesPlayed", 0) > 0:
            home_concede_rate = home.get("goalsConceded", 0) / home["matchesPlayed"]
            away_concede_rate = away.get("goalsConceded", 0) / away["matchesPlayed"]

            if home_concede_rate < 0.6:
                insights.append(f"{home_name} concede just {home_concede_rate:.1f} goals per match, making it very difficult for opponents to score.")
            elif away_concede_rate < 0.6:
                insights.append(f"{away_name} concede just {away_concede_rate:.1f} goals per match, making it very difficult for opponents to score.")

        # Mismatch warning
        if elo_diff > 300:
            weaker = away_name if home_elo > away_elo else home_name
            stronger = home_name if home_elo > away_elo else away_name
            insights.append(f"The quality gap suggests {weaker} will struggle to create meaningful chances against {stronger}'s defence.")

        return insights[:5] if insights else [
            "Both teams are closely matched based on available data.",
            "Recent form and tactical approach will likely decide this contest.",
        ]

    def _calculate_live_probs(self, home_goals: int, away_goals: int, minute: int) -> dict:
        """Calculate live probabilities during a simulation."""
        if minute >= 90:
            if home_goals > away_goals:
                return {"homeWin": 100.0, "draw": 0.0, "awayWin": 0.0}
            elif home_goals == away_goals:
                return {"homeWin": 0.0, "draw": 100.0, "awayWin": 0.0}
            else:
                return {"homeWin": 0.0, "draw": 0.0, "awayWin": 100.0}

        remaining = (90 - minute) / 90.0
        goal_diff = home_goals - away_goals

        if goal_diff > 0:
            home_win = min(95.0, 50 + goal_diff * 20 - remaining * 15)
            draw = max(2.0, 25 - goal_diff * 10 + remaining * 5)
        elif goal_diff < 0:
            home_win = max(2.0, 25 + goal_diff * 10 + remaining * 5)
            draw = max(2.0, 25 + goal_diff * 5 + remaining * 5)
        else:
            home_win = 35.0 + remaining * 5
            draw = 30.0
        away_win = 100.0 - home_win - draw

        return {
            "homeWin": round(max(0, home_win), 1),
            "draw": round(max(0, draw), 1),
            "awayWin": round(max(0, away_win), 1),
        }
