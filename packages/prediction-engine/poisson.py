"""Poisson goal model for football match prediction.

Implements: Req 2.4, 2.5, 2.6
Formula:
  Team A xG = league_base_rate × Team A attack_strength × Team B defence_weakness
  Team B xG = league_base_rate × Team B attack_strength × Team A defence_weakness
"""
import math
from typing import Tuple


# League average goals per match (used as base rate)
DEFAULT_BASE_RATE = 1.35  # Average goals per team per match across top leagues


def calculate_expected_goals(
    attack_strength: float,
    defence_weakness: float,
    base_rate: float = DEFAULT_BASE_RATE,
    home_advantage: float = 0.0,
) -> float:
    """Calculate expected goals for a team.

    Args:
        attack_strength: Team's goals scored per match / league avg goals scored per match
        defence_weakness: Opponent's goals conceded per match / league avg goals conceded per match
        base_rate: League average goals per team per match
        home_advantage: Additional xG bonus for home team (typically 0.2)

    Returns:
        Expected goals (xG) as a decimal value
    """
    xg = base_rate * attack_strength * defence_weakness + home_advantage
    # Clamp to reasonable range (Req 2.6: 0.00 to 10.00)
    return round(max(0.0, min(10.0, xg)), 2)


def poisson_probability(goals: int, expected_goals: float) -> float:
    """Calculate Poisson probability of exactly `goals` being scored.

    P(X = k) = (λ^k * e^-λ) / k!

    Args:
        goals: Number of goals (0-10)
        expected_goals: Lambda (expected goals)

    Returns:
        Probability of this exact goal count
    """
    if expected_goals <= 0:
        return 1.0 if goals == 0 else 0.0

    return (expected_goals ** goals) * math.exp(-expected_goals) / math.factorial(goals)


def generate_goal_probabilities(expected_goals: float, max_goals: int = 10) -> list[float]:
    """Generate probability distribution for 0 to max_goals.

    Args:
        expected_goals: Lambda for Poisson distribution
        max_goals: Maximum goals to calculate (inclusive)

    Returns:
        List of probabilities for 0, 1, 2, ..., max_goals
    """
    return [poisson_probability(g, expected_goals) for g in range(max_goals + 1)]


def calculate_match_xg(
    home_attack: float,
    home_defence: float,
    away_attack: float,
    away_defence: float,
    base_rate: float = DEFAULT_BASE_RATE,
    home_advantage: float = 0.2,
) -> Tuple[float, float]:
    """Calculate expected goals for both teams in a match.

    Args:
        home_attack: Home team attack strength (goals scored / league avg)
        home_defence: Home team defence (goals conceded / league avg)
        away_attack: Away team attack strength
        away_defence: Away team defence (goals conceded / league avg)
        base_rate: League average goals per team per match
        home_advantage: Home team xG bonus

    Returns:
        Tuple of (home_xg, away_xg)
    """
    # Home team xG = base_rate × home_attack × away_defence_weakness + home_advantage
    # away_defence acts as defence_weakness here (higher = more goals conceded)
    home_xg = calculate_expected_goals(home_attack, away_defence, base_rate, home_advantage)

    # Away team xG = base_rate × away_attack × home_defence_weakness
    # No home advantage for away team
    away_xg = calculate_expected_goals(away_attack, home_defence, base_rate, 0.0)

    return home_xg, away_xg
