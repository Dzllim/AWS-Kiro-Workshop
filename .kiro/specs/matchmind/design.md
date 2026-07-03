# Design Document

## Components and Interfaces

### Frontend Components
- **Next.js App (apps/web):** Server-side rendered React application using App Router, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Framer Motion, TanStack Query
- **ThemeProvider:** Manages dark/light mode state with localStorage persistence
- **QueryClientProvider:** TanStack Query v5 client for server state caching (5-min stale time)
- **Navigation:** Responsive nav bar with links, theme toggle, user menu

### Backend Components
- **FastAPI App (apps/api):** REST API server deployed as Lambda container behind API Gateway
- **AuthService:** JWT token generation/validation, bcrypt password hashing, rate limiting
- **PredictionService:** Orchestrates prediction engine calls and caching logic
- **AIService:** Amazon Bedrock Converse API client for explanations
- **AdminService:** Data pipeline triggers, model retraining, system monitoring

### Prediction Engine Components
- **PoissonModel (packages/prediction-engine/poisson.py):** Calculates expected goals using league base rate × attack strength × defence weakness
- **MonteCarloSimulator (packages/prediction-engine/monte_carlo.py):** Runs 10,000+ simulations, produces scoreline distribution
- **EloSystem (packages/prediction-engine/elo.py):** Maintains and updates Elo ratings with K-factor adjustment
- **FeatureEngine (packages/prediction-engine/features.py):** Engineers features from raw data for ML models
- **MLModels (packages/prediction-engine/models.py):** Logistic Regression, Random Forest, XGBoost, LightGBM, Ensemble
- **Explainability (packages/prediction-engine/explainability.py):** Feature importance and contribution calculation
- **TimelineSimulator (packages/prediction-engine/timeline.py):** Minute-by-minute match simulation
- **ScenarioHandler (packages/prediction-engine/scenarios.py):** What-if scenario application

### Infrastructure Components
- **AWS S3:** Raw/processed dataset storage and ML model artifacts
- **AWS DynamoDB:** Users, Teams, Players, Matches, Predictions, ModelMetrics tables
- **AWS Lambda:** Container-based API deployment
- **AWS API Gateway:** Request routing, CORS, rate limiting
- **AWS Amplify:** Frontend hosting with environment-specific configs
- **Amazon Bedrock:** AI explanation generation via Converse API

### Interfaces
- **DataSourceInterface:** Abstract interface for swappable data providers (Football-Data API, OpenFootball, ClubElo, Kaggle)
- **PredictionEngineInterface:** Unified interface for generating predictions with optional weight overrides
- **CacheInterface:** Abstract caching layer (DynamoDB implementation) for prediction results

## Data Models

### Core Domain Models

**PredictionRequest:**
```
homeTeamId: string, awayTeamId: string, competition: string, matchDate: ISO8601, weights?: Map<string, int>
```

**PredictionResult:**
```
predictionId: UUID, probabilities: {homeWin, draw, awayWin}, expectedGoals: {home, away}, confidenceScore: int, scorelines: List<{home, away, probability}>, scorelineMatrix: float[][], additionalProbabilities: {cleanSheetHome, cleanSheetAway, btts, over, under}, featureImportance: List<{factor, contribution}>, firstGoalscorer: {playerId, name, probability}, mostDangerous: {playerId, name, dangerRating}, explanation: string, insights: List<string>
```

**Team:**
```
teamId: UUID, name: string, country: string, competition: string, eloRating: float, attackStrength: float, defenceStrength: float, form: List<W|D|L>, xGFor: float, xGAgainst: float, possession: float, passAccuracy: float, pressingIntensity: float
```

**Player:**
```
playerId: UUID, teamId: UUID, name: string, position: GK|DEF|MID|FWD, goals: int, assists: int, xG: float, xA: float, form: float(1-10), marketValue: float, available: bool
```

**User:**
```
userId: UUID, email: string, passwordHash: string, role: user|admin, favouriteTeams: List<string>(max 5), darkMode: bool
```

**SimulationEvent:**
```
minute: int(1-90), type: goal|red_card|yellow_card|injury|substitution, team: home|away, playerId?: UUID
```

## Overview

MatchLens is an AI-powered football analytics platform built as a distributed system with a Next.js frontend, FastAPI backend, Python prediction engine, AWS infrastructure (S3, DynamoDB, Lambda, Amplify), and Amazon Bedrock for AI explanations.

This design document specifies the system architecture, data models, API contracts, and UI component hierarchy required to implement all 22 requirements.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  Next.js 14 (App Router) + TypeScript + Tailwind + shadcn   │
│  Recharts | Framer Motion | TanStack Query                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS (REST)
┌─────────────────────────▼───────────────────────────────────┐
│                      API GATEWAY (AWS)                        │
│              Rate Limiting | CORS | Auth Validation           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    API SERVER (FastAPI)                       │
│         Lambda Container Image | Pydantic Validation         │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Auth    │  │Prediction│  │   Data   │  │   Admin   │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes   │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
└───────┬──────────────┬──────────────┬──────────────┬────────┘
        │              │              │              │
┌───────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌────▼────────┐
│  Auth        │ │Prediction │ │   Data    │ │  Amazon     │
│  Service     │ │  Engine   │ │  Pipeline │ │  Bedrock    │
│  (JWT/bcrypt)│ │           │ │           │ │  (Converse) │
└──────────────┘ │ ┌───────┐ │ └───────────┘ └─────────────┘
                 │ │Poisson│ │
                 │ │Model  │ │
                 │ ├───────┤ │
                 │ │Monte  │ │
                 │ │Carlo  │ │
                 │ ├───────┤ │
                 │ │Elo    │ │
                 │ │System │ │
                 │ ├───────┤ │
                 │ │ML     │ │
                 │ │Models │ │
                 │ └───────┘ │
                 └─────┬─────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│  DynamoDB    │ │    S3    │ │  External  │
│  Cache       │ │  Storage │ │  Data APIs │
│  (Predictions│ │  (Datasets│ │            │
│   Users)     │ │   Models)│ │            │
└──────────────┘ └──────────┘ └────────────┘
```

### Domain-Driven Design Boundaries

| Bounded Context | Responsibility | Key Components |
|----------------|----------------|----------------|
| Prediction | Match outcome calculation, Monte Carlo simulation, Poisson model | PredictionEngine, MonteCarlo, PoissonModel, EloSystem |
| Explanation | AI-generated insights and explanations | AICoach, BedrockClient, InsightGenerator |
| Data | ETL pipeline, source management, data validation | DataPipeline, SourceAdapters, Validators |
| User | Authentication, personalization, prediction history | AuthService, UserRepository, HistoryTracker |
| Admin | System management, model training, monitoring | AdminService, ModelTrainer, SystemMonitor |
| Presentation | Frontend rendering, visualizations, interactions | Pages, Components, Charts, Animations |

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | Next.js 14 (App Router) | SSR, routing, API routes |
| Language (FE) | TypeScript 5.x | Type safety |
| Styling | Tailwind CSS 3.x | Utility-first CSS |
| UI Components | shadcn/ui | Accessible component primitives |
| Charts | Recharts | Data visualization |
| Animation | Framer Motion | UI transitions |
| State/Cache | TanStack Query v5 | Server state management |
| Backend Framework | FastAPI 0.100+ | REST API |
| Language (BE) | Python 3.11+ | Backend + ML |
| Validation | Pydantic v2 | Schema validation |
| ML Libraries | scikit-learn, scipy, numpy, pandas | Prediction models |
| AI | Amazon Bedrock (Converse API) | Explanations |
| Database | DynamoDB | Cached predictions, users |
| Storage | S3 | Datasets, model artifacts |
| Hosting (FE) | AWS Amplify | Frontend deployment |
| Hosting (BE) | Lambda + API Gateway | Backend deployment |
| IaC | AWS CDK | Infrastructure |
| CI/CD | GitHub Actions | Automation |

## Database Design

### DynamoDB Tables

#### Table: Users

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| userId | String (UUID) | PK | Unique user identifier |
| email | String | GSI-PK | User email (unique) |
| passwordHash | String | - | bcrypt hash (cost 12) |
| role | String | - | "user" or "admin" |
| favouriteTeams | List<String> | - | Up to 5 team IDs |
| darkMode | Boolean | - | Theme preference |
| createdAt | String (ISO8601) | - | Account creation timestamp |
| updatedAt | String (ISO8601) | - | Last update timestamp |

#### Table: Predictions

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| predictionId | String (UUID) | PK | Unique prediction identifier |
| userId | String | GSI-PK | Owner user ID |
| homeTeamId | String | - | Home team identifier |
| awayTeamId | String | - | Away team identifier |
| competition | String | - | Competition name |
| matchDate | String (ISO8601) | SK (on GSI) | Match date |
| homeWinProb | Number | - | Home win probability (0-100) |
| drawProb | Number | - | Draw probability (0-100) |
| awayWinProb | Number | - | Away win probability (0-100) |
| homeXG | Number | - | Home team expected goals |
| awayXG | Number | - | Away team expected goals |
| confidenceScore | Number | - | Confidence (0-100) |
| topScorelines | List<Map> | - | Top 10 scorelines with probs |
| cleanSheetHome | Number | - | Home clean sheet prob (0-1) |
| cleanSheetAway | Number | - | Away clean sheet prob (0-1) |
| btts | Number | - | Both teams to score prob |
| overUnder | Map | - | Over/under for 0.5-4.5 |
| featureImportance | List<Map> | - | Top factors with contributions |
| explanation | String | - | AI-generated explanation |
| insights | List<String> | - | 3-5 generated insights |
| actualResult | Map | - | Actual scoreline (when available) |
| accuracyStatus | String | - | correct/partial/incorrect/pending |
| weights | Map | - | Custom weights if from Prediction Lab |
| createdAt | String (ISO8601) | - | Prediction timestamp |

#### Table: Teams

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| teamId | String | PK | Unique team identifier |
| name | String | GSI-PK | Team name |
| country | String | - | Country |
| competition | String | GSI-PK | Primary competition |
| eloRating | Number | - | Current Elo rating |
| fifaRanking | Number | - | FIFA ranking (if international) |
| attackStrength | Number | - | Attack rating (0-100) |
| defenceStrength | Number | - | Defence rating (0-100) |
| form | List<String> | - | Last 5 results (W/D/L) |
| goalsScored | Number | - | Goals scored this season |
| goalsConceded | Number | - | Goals conceded this season |
| matchesPlayed | Number | - | Matches played this season |
| xGFor | Number | - | xG created per match |
| xGAgainst | Number | - | xG conceded per match |
| possession | Number | - | Average possession % |
| passAccuracy | Number | - | Average pass accuracy % |
| shotsPerMatch | Number | - | Shots per match |
| pressingIntensity | Number | - | Pressing intensity (0-100) |
| updatedAt | String (ISO8601) | - | Last data refresh |

#### Table: Players

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| playerId | String | PK | Unique player identifier |
| teamId | String | GSI-PK | Current team |
| name | String | GSI-PK | Player name |
| position | String | - | GK/DEF/MID/FWD |
| goals | Number | - | Goals this season |
| assists | Number | - | Assists this season |
| xG | Number | - | Expected goals |
| xA | Number | - | Expected assists |
| shotsPerMatch | Number | - | Shots per match |
| keyPasses | Number | - | Key passes per match |
| form | Number | - | Form score 1-10 |
| marketValue | Number | - | Market value in EUR |
| minutesPlayed | Number | - | Minutes played |
| available | Boolean | - | Currently available |
| injuryStatus | String | - | Injury details or null |
| updatedAt | String (ISO8601) | - | Last update |

#### Table: Matches (Historical)

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| matchId | String | PK | Unique match identifier |
| homeTeamId | String | GSI-PK | Home team |
| awayTeamId | String | GSI-PK | Away team |
| competition | String | GSI-PK | Competition |
| season | String | - | Season (e.g., "2024-25") |
| matchDate | String (ISO8601) | SK | Match date |
| homeGoals | Number | - | Home team goals |
| awayGoals | Number | - | Away team goals |
| homeXG | Number | - | Home xG |
| awayXG | Number | - | Away xG |
| homePossession | Number | - | Home possession % |
| homeShots | Number | - | Home total shots |
| homeShotsOnTarget | Number | - | Home shots on target |
| awayShots | Number | - | Away total shots |
| awayShotsOnTarget | Number | - | Away shots on target |
| homePassAccuracy | Number | - | Home pass accuracy % |
| awayPassAccuracy | Number | - | Away pass accuracy % |
| homeManager | String | - | Home team manager |
| awayManager | String | - | Away team manager |

#### Table: ModelMetrics

| Attribute | Type | Key | Description |
|-----------|------|-----|-------------|
| modelId | String | PK | Model identifier (e.g., "xgboost_v3") |
| version | String | SK | Model version timestamp |
| accuracy | Number | - | Accuracy on test set |
| precision | Number | - | Precision score |
| recall | Number | - | Recall score |
| f1Score | Number | - | F1 score |
| rocAuc | Number | - | ROC AUC score |
| confusionMatrix | Map | - | 3x3 confusion matrix |
| calibrationData | List<Map> | - | Calibration curve points |
| trainSize | Number | - | Training set size |
| testSize | Number | - | Test set size |
| trainedAt | String (ISO8601) | - | Training timestamp |

### S3 Bucket Structure

```
matchlens-data/
├── raw/
│   ├── football-data/          # Raw API responses
│   ├── openfootball/           # CSV/JSON datasets
│   ├── clubelo/                # Elo ratings
│   └── kaggle/                 # Historical results
├── processed/
│   ├── teams.parquet           # Processed team metrics
│   ├── players.parquet         # Processed player stats
│   ├── matches.parquet         # Processed match history
│   └── features.parquet        # Engineered features
└── models/
    ├── logistic_regression/    # LR model artifacts
    ├── random_forest/          # RF model artifacts
    ├── xgboost/                # XGB model artifacts
    ├── lightgbm/               # LGBM model artifacts
    └── ensemble/               # Ensemble model artifacts
```

## API Specification

### Base URL
- Development: `http://localhost:8000/api/v1`
- Production: `https://api.matchlens.app/v1`

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass1"
}
```

**Response 201:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "token": "jwt-token",
  "expiresAt": "2026-07-04T12:00:00Z"
}
```

**Error 422:** Validation error (invalid email, weak password)

#### POST /auth/login
Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass1"
}
```

**Response 200:**
```json
{
  "token": "jwt-token",
  "expiresAt": "2026-07-04T12:00:00Z",
  "user": { "userId": "uuid", "email": "...", "role": "user" }
}
```

**Error 401:** Invalid credentials ("Invalid email or password")

### Prediction Endpoints

#### POST /predictions
Generate a match prediction.

**Headers:** `Authorization: Bearer <token>` (optional for basic, required for save)

**Request Body:**
```json
{
  "homeTeamId": "team-uuid",
  "awayTeamId": "team-uuid",
  "competition": "Premier League",
  "matchDate": "2026-08-15",
  "weights": null
}
```

**Response 200:**
```json
{
  "predictionId": "uuid",
  "homeTeam": { "id": "...", "name": "Arsenal" },
  "awayTeam": { "id": "...", "name": "Chelsea" },
  "probabilities": {
    "homeWin": 45.2,
    "draw": 28.1,
    "awayWin": 26.7
  },
  "expectedGoals": { "home": 1.68, "away": 1.22 },
  "confidenceScore": 78,
  "scorelines": [
    { "home": 1, "away": 0, "probability": 12.34 },
    { "home": 2, "away": 1, "probability": 10.56 }
  ],
  "scorelineMatrix": [[0.045, 0.089, ...], ...],
  "additionalProbabilities": {
    "cleanSheetHome": 0.2341,
    "cleanSheetAway": 0.1876,
    "btts": 0.5783,
    "over": { "0.5": 0.8921, "1.5": 0.7234, "2.5": 0.5123, "3.5": 0.2891, "4.5": 0.1234 },
    "under": { "0.5": 0.1079, "1.5": 0.2766, "2.5": 0.4877, "3.5": 0.7109, "4.5": 0.8766 }
  },
  "featureImportance": [
    { "factor": "Recent Form", "contribution": 18.2 },
    { "factor": "Elo Rating", "contribution": 15.6 }
  ],
  "firstGoalscorer": { "playerId": "...", "name": "Saka", "probability": 14.2 },
  "mostDangerous": { "playerId": "...", "name": "Saka", "dangerRating": 8.7 },
  "explanation": "Arsenal are favoured due to...",
  "insights": ["Arsenal have won 4 of their last 5 home matches..."],
  "createdAt": "2026-07-03T10:00:00Z"
}
```

**Error 422:** Invalid input (team not found, past date, etc.)

#### POST /predictions/lab
Generate prediction with custom weights (Prediction Lab).

**Request Body:**
```json
{
  "homeTeamId": "team-uuid",
  "awayTeamId": "team-uuid",
  "competition": "Premier League",
  "matchDate": "2026-08-15",
  "weights": {
    "eloRating": 75,
    "recentForm": 90,
    "headToHead": 50,
    "xG": 80,
    "homeAdvantage": 60,
    "playerAvailability": 70,
    "restDays": 40,
    "managerHistory": 30
  }
}
```

**Response 200:** Same structure as POST /predictions

#### POST /predictions/what-if
Apply what-if scenarios to an existing prediction.

**Request Body:**
```json
{
  "predictionId": "uuid",
  "scenarios": [
    { "type": "player_injury", "playerId": "player-uuid", "team": "home" },
    { "type": "red_card", "team": "away", "minute": 30 },
    { "type": "weather", "condition": "rain" },
    { "type": "venue_change", "neutral": true }
  ]
}
```

**Response 200:**
```json
{
  "baseline": { "homeWin": 45.2, "draw": 28.1, "awayWin": 26.7 },
  "adjusted": { "homeWin": 42.1, "draw": 29.8, "awayWin": 28.1 },
  "differences": { "homeWin": -3.1, "draw": 1.7, "awayWin": 1.4 },
  "scenariosApplied": 2,
  "explanation": "Removing the key striker reduces..."
}
```

**Error 422:** Invalid scenario (player not in lineup, unsupported type)

#### POST /predictions/{predictionId}/save
Save a prediction to user's history. Requires authentication.

**Response 200:**
```json
{ "saved": true, "predictionId": "uuid" }
```

#### GET /predictions/history
Get user's prediction history. Requires authentication.

**Query Parameters:** `page`, `pageSize`, `competition`, `dateFrom`, `dateTo`, `status`

**Response 200:**
```json
{
  "predictions": [...],
  "pagination": { "page": 1, "pageSize": 20, "total": 156 },
  "accuracyStats": { "correct": 42, "partial": 38, "incorrect": 26, "pending": 50, "accuracy": 75.5 }
}
```

### Simulation Endpoints

#### POST /simulations/timeline
Start a match timeline simulation.

**Request Body:**
```json
{
  "homeTeamId": "team-uuid",
  "awayTeamId": "team-uuid",
  "competition": "Premier League",
  "speed": 1
}
```

**Response 200:**
```json
{
  "simulationId": "uuid",
  "events": [
    { "minute": 18, "type": "goal", "team": "home", "player": "Saka", "probabilities": {...} },
    { "minute": 41, "type": "yellow_card", "team": "away", "player": "Rice", "probabilities": {...} }
  ],
  "finalScore": { "home": 2, "away": 1 },
  "finalProbabilities": { "homeWin": 100.0, "draw": 0.0, "awayWin": 0.0 }
}
```

#### POST /simulations/live-event
Inject an event into a live simulation.

**Request Body:**
```json
{
  "simulationId": "uuid",
  "event": { "minute": 55, "type": "goal", "team": "away" }
}
```

**Response 200:**
```json
{
  "updatedProbabilities": { "homeWin": 35.2, "draw": 30.1, "awayWin": 34.7 },
  "updatedXG": { "home": 1.12, "away": 1.45 }
}
```

### Team & Player Endpoints

#### GET /teams
List all teams with optional filtering.

**Query Parameters:** `competition`, `search`, `page`, `pageSize`

**Response 200:**
```json
{
  "teams": [
    { "teamId": "uuid", "name": "Arsenal", "competition": "Premier League", "eloRating": 1890, "form": ["W","W","D","W","L"] }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 120 }
}
```

#### GET /teams/{teamId}
Get full team details including all metrics.

#### GET /teams/compare
Compare two teams.

**Query Parameters:** `teamA`, `teamB`

**Response 200:**
```json
{
  "teamA": { "name": "Arsenal", "metrics": { "attack": 82, "defence": 76, "passing": 84, "pressing": 71, "possession": 62, "xgPerMatch": 2.1 } },
  "teamB": { "name": "Chelsea", "metrics": { "attack": 74, "defence": 72, "passing": 78, "pressing": 68, "possession": 58, "xgPerMatch": 1.7 } },
  "tacticalAdvantages": {
    "teamA": ["Superior attacking output", "Higher pressing intensity", "Better possession retention"],
    "teamB": ["Strong set-piece record", "Better counter-attack efficiency", "Faster transition speed"]
  }
}
```

#### GET /players
List players with filtering and sorting.

**Query Parameters:** `teamId`, `position`, `search`, `sortBy`, `sortOrder`, `page`, `pageSize`

#### GET /players/{playerId}
Get full player profile with all statistics.

### Match Explorer Endpoints

#### GET /matches
Search historical matches.

**Query Parameters:** `team`, `competition`, `season`, `dateFrom`, `dateTo`, `manager`, `page`, `pageSize`

**Response 200:**
```json
{
  "matches": [
    { "matchId": "uuid", "homeTeam": "Arsenal", "awayTeam": "Chelsea", "competition": "Premier League", "date": "2026-01-15", "score": "2-1" }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 45 }
}
```

#### GET /matches/{matchId}
Get full match details.

### AI Coach Endpoints

#### POST /ai/explain
Get AI explanation for a prediction.

**Request Body:**
```json
{
  "predictionId": "uuid"
}
```

**Response 200:**
```json
{
  "explanation": "Arsenal are favoured because...",
  "topFactors": [...],
  "wordCount": 145
}
```

#### POST /ai/ask
Ask the AI Coach a question about a prediction.

**Request Body:**
```json
{
  "predictionId": "uuid",
  "question": "Why is Arsenal favoured?"
}
```

**Response 200:**
```json
{
  "answer": "Arsenal are favoured primarily because...",
  "referencedFactors": ["Recent Form", "Elo Rating", "Home Advantage"]
}
```

### Model Performance Endpoints

#### GET /models/metrics
Get performance metrics for all models.

#### GET /models/compare
Compare model predictions for a given match.

**Query Parameters:** `homeTeamId`, `awayTeamId`, `competition`, `matchDate`

### Admin Endpoints (Requires Admin role)

#### POST /admin/data/refresh
Trigger a data pipeline refresh.

#### POST /admin/models/retrain
Trigger model retraining.

#### GET /admin/system/status
Get system health and status information.

#### GET /admin/system/logs
Get recent system logs.

**Query Parameters:** `page`, `pageSize`, `level` (error/warn/info)

## UI Component Hierarchy

### Page Structure

```
App (layout.tsx)
├── ThemeProvider (dark/light mode)
├── QueryClientProvider (TanStack Query)
├── Navigation
│   ├── Logo
│   ├── NavLinks (Dashboard, Predict, Lab, Compare, Explorer, Players, Analytics)
│   ├── ThemeToggle
│   └── UserMenu (Login/Profile/Settings)
│
├── Landing Page (/)
│   ├── HeroSection (animated graphics, headline, CTA)
│   ├── FeatureCards (5 cards)
│   ├── StatsSection (predictions count, accuracy, competitions)
│   └── Footer
│
├── Dashboard (/dashboard)
│   ├── RecentPredictions
│   ├── FavouriteTeams
│   ├── QuickPredict
│   └── AccuracyOverview
│
├── Prediction Page (/predict)
│   ├── TeamSelector (home/away dropdowns)
│   ├── CompetitionSelector
│   ├── DatePicker
│   ├── PredictButton
│   └── PredictionResults
│       ├── ProbabilityGauge (win/draw/loss)
│       ├── ScorelineHeatMap
│       ├── TopScorelines
│       ├── AdditionalProbabilities (BTTS, O/U, CS)
│       ├── FeatureImportanceChart
│       ├── PlayerInsights (first goalscorer, dangerous player)
│       ├── AIExplanation
│       ├── InsightsPanel
│       └── SaveButton
│
├── Prediction Lab (/lab)
│   ├── TeamSelector
│   ├── WeightSliders (8 factors, 0-100 each)
│   ├── ResetButton
│   ├── LiveProbabilityDisplay (animated)
│   ├── ScorelinePreview
│   └── ExplanationPanel
│
├── Team Comparison (/compare)
│   ├── TeamSelectorA
│   ├── TeamSelectorB
│   ├── RadarChart (6 axes)
│   ├── MetricsTable
│   └── TacticalAdvantages
│
├── Match Explorer (/explorer)
│   ├── SearchBar
│   ├── FilterPanel (competition, season, team, date range)
│   ├── MatchList (paginated)
│   └── MatchDetail (modal/drawer)
│
├── Player Statistics (/players)
│   ├── PlayerSearch
│   ├── PlayerTable (sortable columns)
│   └── PlayerProfile
│       ├── StatsSummary
│       ├── FormIndicator
│       └── PerformanceChart
│
├── Analytics Dashboard (/analytics)
│   ├── ModelMetricsCards
│   ├── ROCCurveChart
│   ├── ConfusionMatrix
│   ├── CalibrationCurve
│   ├── ModelComparison
│   └── AccuracyTimeline
│
├── Match Timeline Simulator (/simulate)
│   ├── TeamSelector
│   ├── SpeedControl
│   ├── PlayPauseButton
│   ├── Timeline (minute-by-minute events)
│   ├── LiveProbabilityChart
│   └── EventInjector
│
├── What-If Scenarios (/what-if)
│   ├── BasePrediction
│   ├── ScenarioBuilder (up to 5)
│   ├── ComparisonView (baseline vs adjusted)
│   └── DifferenceIndicators
│
├── Settings (/settings)
│   ├── ProfileSection
│   ├── FavouriteTeams
│   ├── ThemePreference
│   └── PasswordChange
│
├── Admin (/admin) [Admin role only]
│   ├── DataSourceStatus
│   ├── RefreshControls
│   ├── ModelVersionInfo
│   └── SystemLogs
│
└── About (/about)
    ├── PlatformDescription
    ├── MethodologyExplanation
    └── TeamInfo
```

### Shared Components

```
components/
├── ui/                    # shadcn/ui primitives
│   ├── Button
│   ├── Card
│   ├── Dialog
│   ├── Dropdown
│   ├── Input
│   ├── Slider
│   ├── Skeleton
│   ├── Table
│   ├── Tabs
│   └── Toast
├── charts/
│   ├── ProbabilityGauge
│   ├── RadarChart
│   ├── HeatMap
│   ├── BarChart
│   ├── LineChart
│   ├── ConfusionMatrix
│   ├── ROCCurve
│   ├── CalibrationCurve
│   └── MomentumChart
├── prediction/
│   ├── TeamSelector
│   ├── PredictionCard
│   ├── ScorelineGrid
│   ├── FeatureImportance
│   └── ProbabilityBar
├── layout/
│   ├── Navigation
│   ├── Footer
│   ├── PageHeader
│   └── LoadingSkeleton
└── ai/
    ├── ExplanationPanel
    ├── InsightCard
    └── ChatInterface
```

## Prediction Engine Design

### Core Algorithm

```python
# Poisson Goal Model
team_a_xg = league_base_rate * team_a_attack_strength * team_b_defence_weakness
team_b_xg = league_base_rate * team_b_attack_strength * team_a_defence_weakness

# Where:
# league_base_rate = avg goals per match in competition's current season
# attack_strength = team goals scored per match / league avg goals scored per match
# defence_weakness = opponent goals conceded per match / league avg goals conceded per match
```

### Monte Carlo Simulation Flow

1. Calculate xG for both teams using Poisson model
2. Apply weight adjustments (if Prediction Lab weights provided)
3. Apply home/away modifier (+0.2 xG for home team)
4. For each of 10,000 simulations:
   - Sample goals from Poisson(team_a_xg) and Poisson(team_b_xg)
   - Record scoreline
5. Aggregate results:
   - Win/Draw/Loss probabilities from simulation outcomes
   - Top 10 scorelines by frequency
   - 7×7 scoreline matrix for heat map
   - Derive BTTS, Over/Under, Clean Sheet from same simulation set

### Weight Normalization (Prediction Lab)

```python
# User weights: [w1, w2, ..., w8] each 0-100
# Normalized: w_i / sum(all_w) * 100
# If all zero: equal weights (12.5 each for 8 factors)
```

### Feature Importance Calculation

Feature importance is derived from:
1. Permutation importance from the ensemble ML model
2. Relative contribution calculated per-prediction based on the difference between team metrics
3. Top 5 factors with highest absolute contribution reported

### Elo Rating System

```python
# K-factor: 20 for league matches, 40 for knockout
# Expected score: E_a = 1 / (1 + 10^((R_b - R_a) / 400))
# Update: R_a_new = R_a + K * (actual_score - E_a)
```

### Confidence Score Calculation

```python
confidence = base_confidence
# Adjustments:
# - H2H matches < 3: cap at 50%
# - H2H matches 3-10: base = 60%
# - H2H matches > 10: base = 70%
# + Model agreement bonus (all models agree within 5%): +10%
# + Data freshness (updated within 7 days): +10%
# + Strong form signal: +5%
# Cap at 95% maximum
```

## Folder Structure

```
matchlens/
├── .kiro/
│   ├── specs/matchmind/
│   │   ├── .config.kiro
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   ├── steering/
│   │   └── conventions.md
│   └── hooks/
│
├── apps/
│   ├── web/                          # Next.js Frontend
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── predict/page.tsx
│   │   │   ├── lab/page.tsx
│   │   │   ├── compare/page.tsx
│   │   │   ├── explorer/page.tsx
│   │   │   ├── players/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── simulate/page.tsx
│   │   │   ├── what-if/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── admin/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn components
│   │   │   ├── charts/               # Recharts wrappers
│   │   │   ├── prediction/           # Prediction-specific
│   │   │   ├── layout/               # Layout components
│   │   │   └── ai/                   # AI Coach components
│   │   ├── lib/
│   │   │   ├── api.ts               # API client
│   │   │   ├── auth.ts              # Auth utilities
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── types.ts             # TypeScript types
│   │   │   └── utils.ts             # Shared utilities
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # FastAPI Backend
│       ├── main.py                   # FastAPI app entry
│       ├── config.py                 # Configuration
│       ├── routes/
│       │   ├── auth.py
│       │   ├── predictions.py
│       │   ├── teams.py
│       │   ├── players.py
│       │   ├── matches.py
│       │   ├── simulations.py
│       │   ├── ai.py
│       │   ├── models.py
│       │   └── admin.py
│       ├── services/
│       │   ├── auth_service.py
│       │   ├── prediction_service.py
│       │   ├── team_service.py
│       │   ├── simulation_service.py
│       │   ├── ai_service.py
│       │   └── admin_service.py
│       ├── models/                   # Pydantic schemas
│       │   ├── auth.py
│       │   ├── prediction.py
│       │   ├── team.py
│       │   ├── player.py
│       │   ├── match.py
│       │   └── simulation.py
│       ├── middleware/
│       │   ├── auth.py
│       │   ├── rate_limit.py
│       │   └── cors.py
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/
│   └── prediction-engine/            # Core ML Engine
│       ├── __init__.py
│       ├── engine.py                 # Main prediction orchestrator
│       ├── poisson.py                # Poisson goal model
│       ├── monte_carlo.py            # Monte Carlo simulator
│       ├── elo.py                    # Elo rating system
│       ├── features.py              # Feature engineering
│       ├── models.py                # ML model training/inference
│       ├── explainability.py        # Feature importance
│       ├── timeline.py             # Match timeline simulator
│       ├── scenarios.py            # What-if scenario handler
│       └── config.py               # Engine configuration
│
├── data/
│   ├── raw/                         # Raw source data
│   ├── processed/                   # Processed datasets
│   └── sample/                      # Sample data for development
│
├── infra/
│   ├── cdk/                         # AWS CDK stack
│   │   ├── app.py
│   │   ├── stacks/
│   │   │   ├── api_stack.py
│   │   │   ├── frontend_stack.py
│   │   │   ├── data_stack.py
│   │   │   └── pipeline_stack.py
│   │   └── requirements.txt
│   └── docker/
│       └── Dockerfile.api
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
└── README.md
```

## Architecture Decision Records

### ADR-1: Separation of Prediction and Explanation

**Decision:** Use mathematical models for predictions and Amazon Bedrock exclusively for generating human-readable explanations.

**Rationale:** Predictions must be deterministic, reproducible, and fast. LLMs are non-deterministic and slower. By separating these concerns, predictions remain accurate and consistent while explanations are natural and engaging.

**Consequences:** Two separate processing paths; Bedrock failures don't affect predictions; explanations can reference exact prediction data.

### ADR-2: Poisson + Monte Carlo over Deep Learning

**Decision:** Use Poisson distribution with Monte Carlo simulation (10,000 iterations) as the primary prediction mechanism rather than neural networks.

**Rationale:** Poisson models are well-established for football goal prediction. They're interpretable, fast to compute, and produce calibrated probability outputs. Deep learning would require large training datasets, longer training times, and would be harder to explain to users.

**Consequences:** Predictions complete in <2 seconds; model is explainable; limited to goal-based features (no spatial/tactical deep learning).

### ADR-3: DynamoDB + S3 over PostgreSQL

**Decision:** Use DynamoDB for transactional data and S3 for bulk datasets.

**Rationale:** For AWS BuildFest, native AWS services reduce operational overhead. DynamoDB provides single-digit millisecond reads for cached predictions. S3 handles large dataset storage cost-effectively. This avoids managing a relational database instance.

**Consequences:** No complex joins; data model must be denormalized; S3 for bulk queries via pandas; DynamoDB for real-time reads.

### ADR-4: Lambda Container over EC2/ECS

**Decision:** Deploy the FastAPI backend as a Lambda container image behind API Gateway.

**Rationale:** Lambda containers support up to 10GB images (enough for ML dependencies), scale to zero when idle, and integrate natively with API Gateway for rate limiting and auth. This minimizes operational cost during the hackathon and scales automatically.

**Consequences:** Cold starts (mitigated with provisioned concurrency); 15-minute timeout limit (acceptable for predictions <2s); max 10GB container.

### ADR-5: Client-Side Prediction Lab Calculations

**Decision:** For the Prediction Lab weight adjustments, perform recalculations on the backend via a fast API call rather than client-side.

**Rationale:** While client-side calculation would eliminate network latency, keeping the prediction logic server-side ensures consistency between Prediction Lab results and standard predictions. The 500ms latency budget accommodates a fast API round-trip.

**Consequences:** Every slider change triggers an API call (debounced); consistent results; requires fast backend response.

## Testing Strategy

### Unit Tests
- **Frontend:** Vitest + React Testing Library for components
- **Backend:** pytest for API routes, services, prediction engine
- **Prediction Engine:** pytest for Poisson model, Monte Carlo, Elo calculations

### Integration Tests
- **API:** pytest + httpx for endpoint integration tests
- **Frontend-Backend:** Playwright for E2E flows

### Test Coverage Targets
- Prediction Engine: 90%+ (core math must be correct)
- API Routes: 80%+
- Frontend Components: 70%+

## Deployment Pipeline

```
Push to main
    │
    ├── Lint (ESLint + Ruff)
    ├── Type Check (TypeScript + mypy)
    ├── Unit Tests (Vitest + pytest)
    ├── Integration Tests (pytest + Playwright)
    │
    ├── Build Frontend (next build)
    ├── Build API Container (docker build)
    │
    ├── Deploy Frontend → AWS Amplify
    └── Deploy API → Lambda Container + API Gateway
```

## Correctness Properties

### Property 1: Probability Consistency
Win + Draw + Loss probabilities always sum to 100.0% (±0.1% rounding tolerance)
**Validates: Requirements 1.1, 3.2**

### Property 2: Over/Under Complementarity
For each goal threshold, P(over) + P(under) = 1.0
**Validates: Requirements 11.3**

### Property 3: Scoreline Matrix Integrity
All cells in the 7×7 matrix sum to ≤1.0 (remainder accounts for scores >6)
**Validates: Requirements 2.3**

### Property 4: Monte Carlo Reproducibility
Given the same inputs and random seed, the simulator produces identical results
**Validates: Requirements 2.1**

### Property 5: Elo Conservation
After a match update, the sum of Elo changes for both teams equals zero
**Validates: Requirements 1.4**

### Property 6: Weight Normalization
Normalized weights always sum to 100% (or equal weights if all zero)
**Validates: Requirements 3.5, 3.6**

### Property 7: Confidence Score Bounds
Always integer between 0 and 100, capped at 95 maximum
**Validates: Requirements 1.3, 1.5**

### Property 8: Cache Consistency
Cached prediction is identical to a freshly computed prediction for the same inputs (within 24h window)
**Validates: Requirements 18.1**

### Property 9: Authentication Security
JWT tokens are validated on every protected request; expired tokens are rejected
**Validates: Requirements 13.2, 19.1**

### Property 10: Data Pipeline Idempotency
Running the pipeline twice with the same source data produces identical processed output
**Validates: Requirements 12.5**

## Error Handling

1. **Prediction Engine Failures:** If the engine raises an exception, API returns 500 with a generic error message; detailed error logged server-side
2. **Bedrock Timeout:** If Bedrock does not respond within 10 seconds, fallback to raw feature importance display
3. **Data Source Unavailability:** Retry 3 times with exponential backoff; if all retries fail, log error and continue with other sources
4. **Invalid User Input:** Return 422 with descriptive validation error from Pydantic schema
5. **Rate Limit Exceeded:** Return 429 with Retry-After header (seconds until reset)
6. **DynamoDB Unavailable:** Fall back to on-demand computation; return result without caching
7. **Insufficient Team Data:** Return prediction with reduced confidence and disclaimer
8. **Model Training Failure:** Retain previous model version; log failure; notify admin
9. **Concurrent Admin Operations:** Return 409 if a refresh/retrain is already in progress
10. **Frontend API Errors:** Display error toast with retry option; retain last valid state for simulations
