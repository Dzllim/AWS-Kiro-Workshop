"""Elo rating system for football teams.

Implements: Req 1.4, Property 5 (Elo Conservation)
K-factor: 20 for league matches, 40 for knockout.
"""


def expected_score(rating_a: float, rating_b: float) -> float:
    """Calculate expected score for team A against team B.

    E_a = 1 / (1 + 10^((R_b - R_a) / 400))

    Args:
        rating_a: Elo rating of team A
        rating_b: Elo rating of team B

    Returns:
        Expected score (probability of winning) for team A
    """
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400.0))


def update_ratings(
    rating_a: float,
    rating_b: float,
    actual_score_a: float,
    k_factor: int = 20,
) -> tuple[float, float]:
    """Update Elo ratings after a match.

    Property 5: Sum of changes equals zero (conservation).

    Args:
        rating_a: Current Elo of team A
        rating_b: Current Elo of team B
        actual_score_a: Actual result for A (1.0 = win, 0.5 = draw, 0.0 = loss)
        k_factor: K-factor (20 for league, 40 for knockout)

    Returns:
        Tuple of (new_rating_a, new_rating_b)
    """
    expected_a = expected_score(rating_a, rating_b)
    expected_b = 1.0 - expected_a

    actual_score_b = 1.0 - actual_score_a

    new_rating_a = rating_a + k_factor * (actual_score_a - expected_a)
    new_rating_b = rating_b + k_factor * (actual_score_b - expected_b)

    return round(new_rating_a, 1), round(new_rating_b, 1)


def elo_win_probability(home_elo: float, away_elo: float, home_bonus: float = 50.0) -> dict:
    """Calculate win/draw/loss probability from Elo ratings.

    Applies a home advantage bonus to the home team's effective rating.

    Args:
        home_elo: Home team Elo rating
        away_elo: Away team Elo rating
        home_bonus: Elo points added for home advantage

    Returns:
        Dict with homeWin, draw, awayWin probabilities
    """
    effective_home = home_elo + home_bonus
    home_expected = expected_score(effective_home, away_elo)

    # Convert expected score to W/D/L probabilities
    # Using a simple model: draw probability inversely proportional to rating diff
    rating_diff = abs(effective_home - away_elo)
    draw_base = 0.28  # Base draw probability
    draw_reduction = min(0.15, rating_diff / 2000.0)
    draw_prob = max(0.10, draw_base - draw_reduction)

    # Distribute remaining probability between home and away based on expected score
    remaining = 1.0 - draw_prob
    home_win = remaining * home_expected
    away_win = remaining * (1.0 - home_expected)

    return {
        "homeWin": round(home_win * 100, 1),
        "draw": round(draw_prob * 100, 1),
        "awayWin": round(away_win * 100, 1),
    }
