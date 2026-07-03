"""Build team and player data from real sources.

Reads:
- data/raw/kaggle/results.csv — international match results
- data/raw/kaggle/goalscorers.csv — player goals
- data/raw/fifa/rankings.csv — FIFA rankings

Outputs:
- data/sample/teams.json — team metrics for the prediction engine
- data/sample/players.json — player metrics
- data/sample/matches.json — recent match history

Run: python build_data.py
"""
import csv
import json
import os
import uuid
from collections import defaultdict
from datetime import datetime

# Paths
BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
RAW_DIR = os.path.join(BASE_DIR, "raw")
OUTPUT_DIR = os.path.join(BASE_DIR, "sample")

# Only process recent matches (last N years) for form/strength calculations
RECENT_CUTOFF = "2020-01-01"
# Only include teams that have played since this date
ACTIVE_CUTOFF = "2023-01-01"  # Club data goes up to mid-2023
# For match history display
HISTORY_CUTOFF = "2022-01-01"


def load_results():
    """Load match results from Kaggle CSV (international)."""
    results = []
    path = os.path.join(RAW_DIR, "kaggle", "results.csv")
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            results.append(row)
    print(f"Loaded {len(results)} international matches from Kaggle")
    return results


def load_club_results():
    """Load club match results from Kaggle CSV files."""
    club_dir = os.path.join(RAW_DIR, "kaggle", "club")
    if not os.path.exists(club_dir):
        print("No club data directory found")
        return []

    # Map file names to our competition names
    league_map = {
        "English Premier League.csv": "Premier League",
        "La Liga.csv": "La Liga",
        "Bundesliga.csv": "Bundesliga",
        "Serie A.csv": "Serie A",
        "Ligue 1.csv": "Ligue 1",
        "Eredivisie.csv": "Eredivisie",
        "Liga Portugal.csv": "Liga Portugal",
    }

    results = []
    for filename, competition in league_map.items():
        filepath = os.path.join(club_dir, filename)
        if not os.path.exists(filepath):
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    # Parse date (DD/MM/YY format)
                    date_str = row.get("Date", "")
                    if "/" in date_str:
                        parts = date_str.split("/")
                        if len(parts) == 3:
                            day, month, year = parts
                            # Handle 2-digit years
                            if len(year) == 2:
                                year = "20" + year if int(year) < 50 else "19" + year
                            date_str = f"{year}-{month.zfill(2)}-{day.zfill(2)}"

                    home_goals = row.get("HomeGoals", "0")
                    away_goals = row.get("AwayGoals", "0")

                    # Handle float values like "3.0"
                    home_goals = str(int(float(home_goals))) if home_goals else "0"
                    away_goals = str(int(float(away_goals))) if away_goals else "0"

                    results.append({
                        "date": date_str,
                        "home_team": row.get("HomeTeam", "").strip(),
                        "away_team": row.get("AwayTeam", "").strip(),
                        "home_score": home_goals,
                        "away_score": away_goals,
                        "tournament": competition,
                        "city": "",
                        "country": "",
                        "neutral": "FALSE",
                    })
                except (ValueError, KeyError):
                    continue

        print(f"  Loaded {filename}: {sum(1 for r in results if r['tournament'] == competition)} matches")

    print(f"Loaded {len(results)} total club matches")
    return results


def load_goalscorers():
    """Load goalscorer data from Kaggle CSV."""
    scorers = []
    path = os.path.join(RAW_DIR, "kaggle", "goalscorers.csv")
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            scorers.append(row)
    print(f"Loaded {len(scorers)} goalscorer records")
    return scorers


def load_fifa_rankings():
    """Load FIFA rankings CSV."""
    rankings = {}
    path = os.path.join(RAW_DIR, "fifa", "rankings.csv")
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rankings[row["team"]] = {
                "rank": int(row["rank"]),
                "points": float(row["points"]),
            }
    print(f"Loaded {len(rankings)} FIFA rankings")
    return rankings


def calculate_elo(results):
    """Calculate Elo ratings from match history."""
    elo = defaultdict(lambda: 1500.0)
    k_factor = 20

    for match in results:
        home = match["home_team"]
        away = match["away_team"]
        try:
            home_goals = int(match["home_score"])
            away_goals = int(match["away_score"])
        except (ValueError, KeyError):
            continue

        # Expected scores
        exp_home = 1.0 / (1.0 + 10 ** ((elo[away] - elo[home]) / 400.0))
        exp_away = 1.0 - exp_home

        # Actual scores
        if home_goals > away_goals:
            actual_home, actual_away = 1.0, 0.0
        elif home_goals == away_goals:
            actual_home, actual_away = 0.5, 0.5
        else:
            actual_home, actual_away = 0.0, 1.0

        # Update
        elo[home] += k_factor * (actual_home - exp_home)
        elo[away] += k_factor * (actual_away - exp_away)

    return dict(elo)


def calculate_team_metrics(results, elo_ratings, fifa_rankings):
    """Calculate team stats from recent matches."""
    # Filter to recent matches
    recent = [r for r in results if r["date"] >= RECENT_CUTOFF]
    print(f"Using {len(recent)} recent matches (since {RECENT_CUTOFF})")

    team_stats = defaultdict(lambda: {
        "goals_scored": 0, "goals_conceded": 0, "matches": 0,
        "wins": 0, "draws": 0, "losses": 0, "results": [],
        "competitions_played": defaultdict(int),
        "last_match": "",
    })

    for match in recent:
        home = match["home_team"]
        away = match["away_team"]
        tournament = match.get("tournament", "International")
        try:
            hg = int(match["home_score"])
            ag = int(match["away_score"])
        except (ValueError, KeyError):
            continue

        # Track which competitions this team plays in
        known_club_leagues = {"Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Eredivisie", "Liga Portugal"}
        if tournament in known_club_leagues:
            team_stats[home]["competitions_played"][tournament] += 1
            team_stats[away]["competitions_played"][tournament] += 1
        else:
            team_stats[home]["competitions_played"]["International"] += 1
            team_stats[away]["competitions_played"]["International"] += 1

        # Home team
        team_stats[home]["goals_scored"] += hg
        team_stats[home]["goals_conceded"] += ag
        team_stats[home]["matches"] += 1
        if match["date"] > team_stats[home]["last_match"]:
            team_stats[home]["last_match"] = match["date"]
        if hg > ag:
            team_stats[home]["wins"] += 1
            team_stats[home]["results"].append("W")
        elif hg == ag:
            team_stats[home]["draws"] += 1
            team_stats[home]["results"].append("D")
        else:
            team_stats[home]["losses"] += 1
            team_stats[home]["results"].append("L")

        # Away team
        team_stats[away]["goals_scored"] += ag
        team_stats[away]["goals_conceded"] += hg
        team_stats[away]["matches"] += 1
        if match["date"] > team_stats[away]["last_match"]:
            team_stats[away]["last_match"] = match["date"]
        if ag > hg:
            team_stats[away]["wins"] += 1
            team_stats[away]["results"].append("W")
        elif ag == hg:
            team_stats[away]["draws"] += 1
            team_stats[away]["results"].append("D")
        else:
            team_stats[away]["losses"] += 1
            team_stats[away]["results"].append("L")

    # Build team objects — only include teams with enough recent matches AND active recently
    teams = []
    for team_name, stats in team_stats.items():
        if stats["matches"] < 8:
            continue

        # Determine primary competition (the one they played most matches in)
        comp_counts = stats["competitions_played"]
        primary_competition = max(comp_counts, key=comp_counts.get) if comp_counts else "International"

        # Different active cutoff for international vs club teams
        # Club teams must have played since 2024 (current season)
        # International teams can be older since they play less often
        if primary_competition == "International":
            if stats["last_match"] < "2022-01-01":
                continue
        else:
            if stats["last_match"] < ACTIVE_CUTOFF:
                continue

        matches_played = stats["matches"]
        goals_per_match = stats["goals_scored"] / matches_played
        conceded_per_match = stats["goals_conceded"] / matches_played
        win_rate = stats["wins"] / matches_played

        # Attack strength (0-100 scale based on goals per match)
        # Average international team scores ~1.3 goals/match
        attack_strength = min(95, max(30, int(goals_per_match / 1.3 * 65 + 10)))

        # Defence strength (0-100 scale, lower conceded = higher rating)
        defence_strength = min(95, max(30, int((1.5 - conceded_per_match) / 1.5 * 65 + 30)))

        # Elo
        elo = round(elo_ratings.get(team_name, 1500), 0)

        # FIFA ranking
        fifa = fifa_rankings.get(team_name, {})
        fifa_rank = fifa.get("rank", 100)

        # Form (last 5)
        form = stats["results"][-5:] if len(stats["results"]) >= 5 else stats["results"]

        # xG estimate (simplified: based on scoring rate)
        xg_for = round(goals_per_match * 0.9 + 0.2, 2)  # Slightly below actual (regression)
        xg_against = round(conceded_per_match * 0.9 + 0.2, 2)

        team_id = f"team-{team_name.lower().replace(' ', '-')[:20]}"

        teams.append({
            "teamId": team_id,
            "name": team_name,
            "country": team_name,
            "competition": primary_competition,
            "eloRating": int(elo),
            "fifaRanking": fifa_rank,
            "attackStrength": attack_strength,
            "defenceStrength": defence_strength,
            "form": form,
            "goalsScored": stats["goals_scored"],
            "goalsConceded": stats["goals_conceded"],
            "matchesPlayed": matches_played,
            "xGFor": xg_for,
            "xGAgainst": xg_against,
            "possession": min(65, max(40, 50 + int((attack_strength - 60) * 0.3))),
            "passAccuracy": min(92, max(70, 75 + int((attack_strength - 50) * 0.2))),
            "shotsPerMatch": round(goals_per_match * 5 + 4, 1),
            "pressingIntensity": min(85, max(50, 55 + int(win_rate * 30))),
        })

    # Sort by Elo rating
    teams.sort(key=lambda t: t["eloRating"], reverse=True)
    print(f"Generated {len(teams)} teams with metrics")
    return teams


def calculate_player_metrics(goalscorers, teams):
    """Calculate player stats from goalscorer data."""
    # Filter to recent
    recent_scorers = [g for g in goalscorers if g["date"] >= RECENT_CUTOFF]

    # Count goals per player per team
    player_goals = defaultdict(lambda: {"goals": 0, "matches_scored": set(), "team": "", "penalties": 0})

    for record in recent_scorers:
        scorer = record["scorer"]
        team = record["team"]
        date = record["date"]
        is_penalty = record.get("penalty", "FALSE") == "TRUE"
        is_own_goal = record.get("own_goal", "FALSE") == "TRUE"

        if is_own_goal or not scorer.strip():
            continue

        key = f"{scorer}|{team}"
        player_goals[key]["goals"] += 1
        player_goals[key]["matches_scored"].add(date)
        player_goals[key]["team"] = team
        if is_penalty:
            player_goals[key]["penalties"] += 1

    # Build player objects — top scorers PER TEAM (not just global top 50)
    team_id_map = {t["name"]: t["teamId"] for t in teams}

    # Group by team first
    players_by_team: dict[str, list] = defaultdict(list)
    for key, stats in player_goals.items():
        name = key.split("|")[0]
        team_name = stats["team"]
        if team_name not in team_id_map:
            continue
        players_by_team[team_name].append((name, stats))

    players = []
    for team_name, team_players in players_by_team.items():
        # Sort by goals, take top 8 per team
        team_players.sort(key=lambda x: x[1]["goals"], reverse=True)
        for name, stats in team_players[:8]:
            team_id = team_id_map[team_name]
            goals = stats["goals"]
            matches_scored_in = len(stats["matches_scored"])

            xg = round(goals * 0.85, 1)
            form = min(9.8, max(5.0, round(5.0 + (goals / max(1, matches_scored_in)) * 3, 1)))

            player_id = f"player-{name.lower().replace(' ', '-')[:20]}"

            players.append({
                "playerId": player_id,
                "teamId": team_id,
                "name": name,
                "position": "FWD",
                "goals": goals,
                "assists": max(0, int(goals * 0.3)),
                "xG": xg,
                "xA": round(goals * 0.25, 1),
                "shotsPerMatch": round(2.0 + goals * 0.1, 1),
                "keyPasses": round(1.0 + goals * 0.05, 1),
                "form": form,
                "marketValue": max(5, int(goals * 2.5)) * 1000000,
                "minutesPlayed": matches_scored_in * 75,
                "available": True,
            })

    print(f"Generated {len(players)} player profiles across {len(players_by_team)} teams")
    return players


def build_match_history(results):
    """Build recent match history for the explorer."""
    recent = [r for r in results if r["date"] >= HISTORY_CUTOFF]
    # Take the most recent 200 matches
    recent.sort(key=lambda x: x["date"], reverse=True)
    recent = recent[:200]

    matches = []
    for m in recent:
        try:
            hg = int(m["home_score"])
            ag = int(m["away_score"])
        except (ValueError, KeyError):
            continue

        match_id = f"match-{m['date']}-{m['home_team'][:3].lower()}-{m['away_team'][:3].lower()}"
        matches.append({
            "matchId": match_id,
            "homeTeam": m["home_team"],
            "awayTeam": m["away_team"],
            "homeTeamId": f"team-{m['home_team'].lower().replace(' ', '-')[:20]}",
            "awayTeamId": f"team-{m['away_team'].lower().replace(' ', '-')[:20]}",
            "competition": m.get("tournament", "International"),
            "season": m["date"][:4],
            "matchDate": m["date"],
            "homeGoals": hg,
            "awayGoals": ag,
            "homeXG": round(hg * 0.85 + 0.3, 1),
            "awayXG": round(ag * 0.85 + 0.3, 1),
            "homePossession": 50 + (hg - ag) * 3,
            "homeShots": hg * 4 + 5,
            "homeShotsOnTarget": hg * 2 + 2,
            "awayShots": ag * 4 + 5,
            "awayShotsOnTarget": ag * 2 + 2,
            "homePassAccuracy": min(92, max(72, 80 + (hg - ag) * 2)),
            "awayPassAccuracy": min(92, max(72, 80 + (ag - hg) * 2)),
        })

    print(f"Generated {len(matches)} match history records")
    return matches


def main():
    print("=" * 60)
    print("MatchLens Data Pipeline — Building from real sources")
    print("=" * 60)

    # Load raw data
    results = load_results()
    club_results = load_club_results()
    goalscorers = load_goalscorers()
    fifa_rankings = load_fifa_rankings()

    # Combine international + club results
    all_results = results + club_results
    print(f"\nTotal combined matches: {len(all_results)}")

    # Calculate Elo ratings from full history
    print("\nCalculating Elo ratings from full match history...")
    elo_ratings = calculate_elo(all_results)

    # Build team metrics from recent matches
    print("\nBuilding team metrics...")
    teams = calculate_team_metrics(all_results, elo_ratings, fifa_rankings)

    # Build player metrics from goalscorer data
    print("\nBuilding player metrics...")
    players = calculate_player_metrics(goalscorers, teams)

    # Build match history (use both international and club)
    print("\nBuilding match history...")
    matches = build_match_history(all_results)

    # Save output
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(os.path.join(OUTPUT_DIR, "teams.json"), "w", encoding="utf-8") as f:
        json.dump(teams, f, indent=2, ensure_ascii=False)

    with open(os.path.join(OUTPUT_DIR, "players.json"), "w", encoding="utf-8") as f:
        json.dump(players, f, indent=2, ensure_ascii=False)

    with open(os.path.join(OUTPUT_DIR, "matches.json"), "w", encoding="utf-8") as f:
        json.dump(matches, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    print(f"✓ Saved {len(teams)} teams to data/sample/teams.json")
    print(f"✓ Saved {len(players)} players to data/sample/players.json")
    print(f"✓ Saved {len(matches)} matches to data/sample/matches.json")
    print("=" * 60)
    print("\nRestart the backend to use the new data:")
    print("  python -m uvicorn main:app --reload --port 8000")


if __name__ == "__main__":
    main()
