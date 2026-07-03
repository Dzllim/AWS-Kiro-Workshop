"""Monte Carlo simulation for scoreline prediction.

Implements: Req 2.1, 2.2, 2.3, 11.1-11.5
Runs 10,000+ simulations using Poisson-distributed goal counts.
"""
import random
from typing import Tuple
from poisson import generate_goal_probabilities


def run_simulation(
    home_xg: float,
    away_xg: float,
    num_simulations: int = 10000,
    seed: int | None = None,
) -> dict:
    """Run Monte Carlo simulation to generate match outcome probabilities.

    Args:
        home_xg: Home team expected goals
        away_xg: Away team expected goals
        num_simulations: Number of simulations (minimum 10,000)
        seed: Random seed for reproducibility (Property 4)

    Returns:
        Dict with probabilities, scorelines, matrix, and additional stats
    """
    if seed is not None:
        random.seed(seed)

    # Generate Poisson probability distributions for sampling
    home_probs = generate_goal_probabilities(home_xg, max_goals=10)
    away_probs = generate_goal_probabilities(away_xg, max_goals=10)

    # Create cumulative distributions for sampling
    home_cdf = _cumulative(home_probs)
    away_cdf = _cumulative(away_probs)

    # Run simulations
    scoreline_counts: dict[Tuple[int, int], int] = {}
    home_wins = 0
    draws = 0
    away_wins = 0

    for _ in range(num_simulations):
        home_goals = _sample_from_cdf(home_cdf)
        away_goals = _sample_from_cdf(away_cdf)

        scoreline = (home_goals, away_goals)
        scoreline_counts[scoreline] = scoreline_counts.get(scoreline, 0) + 1

        if home_goals > away_goals:
            home_wins += 1
        elif home_goals == away_goals:
            draws += 1
        else:
            away_wins += 1

    # Calculate probabilities (Req 1.1: sum to 100%)
    home_win_prob = round(home_wins / num_simulations * 100, 1)
    draw_prob = round(draws / num_simulations * 100, 1)
    away_win_prob = round(100.0 - home_win_prob - draw_prob, 1)  # Ensure sums to 100

    # Top 10 scorelines (Req 2.2)
    sorted_scorelines = sorted(scoreline_counts.items(), key=lambda x: x[1], reverse=True)
    top_scorelines = [
        {"home": s[0], "away": s[1], "probability": round(count / num_simulations * 100, 2)}
        for (s, count) in sorted_scorelines[:10]
    ]

    # 7x7 scoreline matrix (Req 2.3)
    matrix = _build_scoreline_matrix(scoreline_counts, num_simulations, max_goals=6)

    # Additional probabilities (Req 11)
    additional = _calculate_additional_probabilities(scoreline_counts, num_simulations)

    return {
        "probabilities": {
            "homeWin": home_win_prob,
            "draw": draw_prob,
            "awayWin": away_win_prob,
        },
        "scorelines": top_scorelines,
        "scoreline_matrix": matrix,
        "additional_probabilities": additional,
        "simulations_run": num_simulations,
    }


def _cumulative(probs: list[float]) -> list[float]:
    """Convert probability list to cumulative distribution."""
    cdf = []
    total = 0.0
    for p in probs:
        total += p
        cdf.append(total)
    return cdf


def _sample_from_cdf(cdf: list[float]) -> int:
    """Sample a value from cumulative distribution."""
    r = random.random()
    for i, c in enumerate(cdf):
        if r <= c:
            return i
    return len(cdf) - 1


def _build_scoreline_matrix(
    scoreline_counts: dict[Tuple[int, int], int],
    num_simulations: int,
    max_goals: int = 6,
) -> list[list[float]]:
    """Build 7x7 scoreline probability matrix for heat map. (Req 2.3)"""
    matrix = []
    for home_goals in range(max_goals + 1):
        row = []
        for away_goals in range(max_goals + 1):
            count = scoreline_counts.get((home_goals, away_goals), 0)
            row.append(round(count / num_simulations, 4))
        matrix.append(row)
    return matrix


def _calculate_additional_probabilities(
    scoreline_counts: dict[Tuple[int, int], int],
    num_simulations: int,
) -> dict:
    """Calculate clean sheet, BTTS, over/under from simulation results. (Req 11)"""
    clean_sheet_home = 0
    clean_sheet_away = 0
    btts = 0
    total_goals_distribution: dict[int, int] = {}

    for (home_g, away_g), count in scoreline_counts.items():
        total = home_g + away_g
        total_goals_distribution[total] = total_goals_distribution.get(total, 0) + count

        if away_g == 0:
            clean_sheet_home += count
        if home_g == 0:
            clean_sheet_away += count
        if home_g > 0 and away_g > 0:
            btts += count

    # Over/Under probabilities (Req 11.3)
    thresholds = [0.5, 1.5, 2.5, 3.5, 4.5]
    over = {}
    under = {}

    for threshold in thresholds:
        over_count = sum(
            count for total, count in total_goals_distribution.items()
            if total > threshold
        )
        over_prob = round(over_count / num_simulations, 4)
        under_prob = round(1.0 - over_prob, 4)
        over[str(threshold)] = over_prob
        under[str(threshold)] = under_prob

    return {
        "clean_sheet_home": round(clean_sheet_home / num_simulations, 4),
        "clean_sheet_away": round(clean_sheet_away / num_simulations, 4),
        "btts": round(btts / num_simulations, 4),
        "over": over,
        "under": under,
    }
