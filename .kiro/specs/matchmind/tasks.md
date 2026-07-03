# Implementation Plan:

## Overview

MatchLens implementation is organized into 12 phases with 45 tasks. Phases are sequential but tasks within a phase can be parallelized where noted. Each task references the requirements it fulfills.

**Estimated Timeline:** 4-6 weeks for full implementation
**Priority Order:** Phase 1-5 (MVP), Phase 6-9 (Full Features), Phase 10-12 (Production Readiness)

## Task Dependency Graph

```json
{
  "waves": [
    {"id": "wave1", "tasks": [1, 2, 3, 4]},
    {"id": "wave2", "tasks": [5, 6, 7, 8, 9]},
    {"id": "wave3", "tasks": [10, 11, 12, 13, 14, 15, 16]},
    {"id": "wave4", "tasks": [17, 18]},
    {"id": "wave5", "tasks": [19, 20, 21]},
    {"id": "wave6", "tasks": [22, 23, 24]},
    {"id": "wave7", "tasks": [25, 26, 27, 28]},
    {"id": "wave8", "tasks": [29, 30, 31, 32]},
    {"id": "wave9", "tasks": [33, 34]},
    {"id": "wave10", "tasks": [35, 36, 37]},
    {"id": "wave11", "tasks": [38, 39, 40]},
    {"id": "wave12", "tasks": [41, 42, 43, 44, 45]}
  ]
}
```

**Critical Path:** Tasks 1-3 → Tasks 5-8 → Tasks 10-11 → Tasks 19-20 → Tasks 38-40
**Parallel Tracks:** Within each wave, tasks can be developed in parallel

## Tasks

### Phase 1: Project Setup & Core Infrastructure

- [x] 1. Initialize monorepo structure with apps/web (Next.js), apps/api (FastAPI), packages/prediction-engine, data/, infra/
  - Requirements: R20
  - Create package.json (root), next.config.js, requirements.txt, folder structure
  - Verify: All folders exist, Next.js dev server starts, FastAPI uvicorn starts

- [x] 2. Set up Next.js frontend with TypeScript, Tailwind CSS, shadcn/ui
  - Requirements: R15, R16
  - Install dependencies: next, typescript, tailwindcss, @shadcn/ui, recharts, framer-motion, @tanstack/react-query
  - Configure tailwind.config.ts with dark mode support
  - Create base layout.tsx with ThemeProvider and QueryClientProvider
  - Verify: `npm run dev` serves the app, dark/light mode toggle works

- [x] 3. Set up FastAPI backend with project structure
  - Requirements: R19, R20
  - Create main.py with CORS middleware, rate limiting middleware
  - Create routes/, services/, models/ directories with __init__.py
  - Set up Pydantic v2 base models
  - Create Dockerfile for Lambda container
  - Verify: `uvicorn main:app` starts, /docs shows Swagger UI

- [x] 4. Set up sample data and data models
  - Requirements: R12
  - Create sample team data (20 teams with all metrics) in data/sample/teams.json
  - Create sample player data (50 players) in data/sample/players.json
  - Create sample match history (200 matches) in data/sample/matches.json
  - Create TypeScript types matching DynamoDB schema
  - Create Pydantic models matching DynamoDB schema
  - Verify: Data loads correctly in both frontend and backend

## Phase 2: Prediction Engine Core

- [x] 5. Implement Poisson goal model
  - Requirements: R1, R2
  - Create packages/prediction-engine/poisson.py
  - Implement xG calculation: league_base_rate × attack_strength × defence_weakness
  - Implement Poisson probability distribution for 0-10 goals
  - Verify: Unit tests pass for known team matchups with expected xG ranges

- [x] 6. Implement Monte Carlo simulator
  - Requirements: R2, R11
  - Create packages/prediction-engine/monte_carlo.py
  - Run 10,000 simulations using Poisson-distributed samples
  - Generate top 10 scorelines with probabilities
  - Generate 7×7 scoreline matrix
  - Derive BTTS, Over/Under, Clean Sheet from same simulation set
  - Verify: Probabilities sum to ~100%, scoreline matrix covers 0-6 for both teams

- [x] 7. Implement Elo rating system
  - Requirements: R1
  - Create packages/prediction-engine/elo.py
  - Implement Elo calculation with K-factor (20 league, 40 knockout)
  - Implement expected score and rating update formulas
  - Verify: Unit tests confirm Elo adjustments match expected values

- [x] 8. Implement main prediction engine orchestrator
  - Requirements: R1, R2, R11
  - Create packages/prediction-engine/engine.py
  - Combine Poisson model, Monte Carlo, and Elo into unified prediction
  - Calculate win/draw/loss probabilities (sum to 100%)
  - Calculate confidence score
  - Calculate all additional probabilities
  - Verify: Full prediction returns all required fields within 2 seconds

- [x] 9. Implement feature importance and explainability
  - Requirements: R1, R4
  - Create packages/prediction-engine/explainability.py
  - Calculate per-prediction feature contributions
  - Rank top 5 factors by absolute contribution
  - Format importance as factor name + contribution percentage
  - Verify: Feature importance sums make sense, top factors are ordered correctly

## Phase 3: API Endpoints

- [x] 10. Implement prediction API endpoints
  - Requirements: R1, R2, R3, R11
  - Create routes/predictions.py with POST /predictions
  - Create POST /predictions/lab (with custom weights)
  - Integrate prediction engine with API layer
  - Return full prediction response schema
  - Verify: POST /predictions returns valid prediction in <2 seconds

- [x] 11. Implement authentication endpoints
  - Requirements: R13, R19
  - Create routes/auth.py with POST /auth/register, POST /auth/login
  - Implement JWT token generation with configurable expiration
  - Implement bcrypt password hashing (cost factor 12)
  - Implement rate limiting middleware (100/min auth, 30/min unauth)
  - Verify: Register creates user, login returns token, invalid creds return generic error

- [x] 12. Implement team and player endpoints
  - Requirements: R5, R7
  - Create routes/teams.py with GET /teams, GET /teams/{id}, GET /teams/compare
  - Create routes/players.py with GET /players, GET /players/{id}
  - Implement team comparison with tactical advantages
  - Verify: Endpoints return correct data, comparison produces radar chart data

- [x] 13. Implement match explorer endpoints
  - Requirements: R6
  - Create routes/matches.py with GET /matches, GET /matches/{id}
  - Implement filtering by competition, season, team, date range, manager
  - Implement pagination (default 20, max 100)
  - Verify: Filters work correctly, pagination metadata is accurate

- [x] 14. Implement what-if scenario endpoint
  - Requirements: R9
  - Create POST /predictions/what-if
  - Implement scenario application (injury, red card, weather, venue)
  - Return baseline vs adjusted comparison with differences
  - Verify: Scenarios modify probabilities, invalid scenarios return error

- [x] 15. Implement simulation endpoints
  - Requirements: R10, R22
  - Create routes/simulations.py with POST /simulations/timeline, POST /simulations/live-event
  - Implement match timeline generation (90 min + stoppage)
  - Implement live event injection with probability recalculation
  - Verify: Timeline generates valid events, live events update probabilities

- [x] 16. Implement prediction history endpoints
  - Requirements: R14
  - Create GET /predictions/history with filtering
  - Implement accuracy classification (correct/partial/incorrect)
  - Implement POST /predictions/{id}/save
  - Verify: History returns paginated results, accuracy stats are correct

## Phase 4: Frontend - Landing Page & Layout

- [x] 17. Build app layout with navigation and theme toggle
  - Requirements: R15, R16
  - Create layout.tsx with Navigation component
  - Implement dark/light mode with localStorage persistence
  - Create NavLinks, ThemeToggle, UserMenu components
  - Implement responsive navigation (mobile hamburger menu)
  - Verify: Navigation renders on all pages, theme persists across refreshes

- [x] 18. Build landing page
  - Requirements: R16
  - Create HeroSection with animated graphics (Framer Motion)
  - Create FeatureCards (5 capability cards)
  - Create StatsSection (predictions, accuracy, competitions)
  - Implement responsive layout (375px, 768px, 1920px)
  - Implement CTA button linking to registration
  - Verify: LCP < 2.5s, responsive at all breakpoints, animations smooth

## Phase 5: Frontend - Core Prediction Features

- [x] 19. Build prediction page with team selection and results
  - Requirements: R1, R2, R11, R15
  - Create TeamSelector component (searchable dropdown with favourite teams)
  - Create CompetitionSelector and DatePicker
  - Create PredictButton with loading state
  - Create PredictionResults container
  - Create ProbabilityGauge (circular chart for win/draw/loss)
  - Create TopScorelines (bar chart of top 10)
  - Create ScorelineHeatMap (7×7 grid)
  - Create AdditionalProbabilities (BTTS, O/U, CS progress bars)
  - Create FeatureImportanceChart (horizontal bar chart)
  - Create PlayerInsights (first goalscorer, dangerous player cards)
  - Implement loading skeletons for all components
  - Verify: Full prediction flow works, all charts render, responsive

- [x] 20. Build Prediction Lab page
  - Requirements: R3
  - Create WeightSliders component (8 sliders, 0-100, integer steps)
  - Create ResetButton
  - Implement debounced API calls on slider change (500ms budget)
  - Create LiveProbabilityDisplay with animated transitions (200-400ms)
  - Create ScorelinePreview
  - Implement equal-weight fallback when all sliders are 0
  - Verify: Slider changes trigger recalculation, animations smooth, probabilities sum to 100%

- [x] 21. Build AI Coach and explanation panels
  - Requirements: R4, R21
  - Create ExplanationPanel showing AI-generated text
  - Create InsightCards (3-5 insights per prediction)
  - Create ChatInterface for asking questions
  - Implement fallback display when Bedrock is unavailable
  - Verify: Explanations reference actual factors, insights cite statistics

## Phase 6: Frontend - Comparison, Explorer, Players

- [x] 22. Build team comparison page
  - Requirements: R5
  - Create team selection (two teams)
  - Create RadarChart component (6 axes, 0-100 scale)
  - Create MetricsTable with numerical values
  - Create TacticalAdvantages panel (top 3 per team)
  - Handle insufficient data state
  - Verify: Radar chart renders correctly, cross-competition comparison works

- [x] 23. Build match explorer page
  - Requirements: R6
  - Create SearchBar with debounced input (3+ characters)
  - Create FilterPanel (competition, season, team, date range)
  - Create MatchList with pagination
  - Create MatchDetail drawer/modal with full stats
  - Handle empty results and error states
  - Verify: Search and filters work, pagination navigates correctly

- [x] 24. Build player statistics page
  - Requirements: R7
  - Create PlayerSearch component
  - Create PlayerTable (sortable by all metric columns)
  - Create PlayerProfile with stats summary, form indicator (1-10)
  - Handle unavailable player data
  - Verify: Sorting works, form indicator displays correctly

## Phase 7: Frontend - Simulations & Analytics

- [x] 25. Build match timeline simulator page
  - Requirements: R10
  - Create team selection and start button
  - Create SpeedControl (1x, 2x, 5x, 10x)
  - Create PlayPauseButton
  - Create Timeline component (minute-by-minute events)
  - Create LiveProbabilityChart (animated updates)
  - Create EventInjector (manual event input at any minute)
  - Handle simulation end state and error recovery
  - Verify: Timeline advances, events update probabilities, pause/resume works

- [x] 26. Build what-if scenarios page
  - Requirements: R9
  - Create BasePrediction display
  - Create ScenarioBuilder (add up to 5 scenarios)
  - Create ComparisonView (baseline vs adjusted side-by-side)
  - Create DifferenceIndicators (positive/negative changes)
  - Handle invalid scenario errors
  - Verify: Scenarios modify predictions, removal reverts, max 5 enforced

- [x] 27. Build live probability simulation
  - Requirements: R22
  - Create event injection interface (minute 1-90, 5 event types)
  - Create animated probability chart (transitions within 1 second)
  - Handle recalculation failures (show last valid state)
  - Verify: Events update probabilities, animation smooth, error handling works

- [x] 28. Build analytics/model performance dashboard
  - Requirements: R8
  - Create ModelMetricsCards (accuracy, precision, recall, F1 per model)
  - Create ROCCurveChart
  - Create ConfusionMatrix visualization
  - Create CalibrationCurve chart
  - Create ModelComparison (side-by-side predictions)
  - Create AccuracyTimeline (running accuracy over time)
  - Handle empty metrics state
  - Verify: All charts render with sample data, model comparison displays correctly

## Phase 8: Authentication, Settings, Admin

- [x] 29. Build authentication UI (login/register pages)
  - Requirements: R13
  - Create LoginForm with email/password validation
  - Create RegisterForm with password requirements indicator
  - Implement JWT token storage and auto-refresh
  - Implement authenticated route protection
  - Verify: Register creates account, login stores token, protected routes redirect

- [x] 30. Build settings page
  - Requirements: R13, R15
  - Create ProfileSection (email display)
  - Create FavouriteTeams selector (up to 5 teams)
  - Create ThemePreference toggle
  - Create PasswordChange form
  - Verify: Settings save correctly, favourite teams appear in dropdowns

- [x] 31. Build prediction history page
  - Requirements: R14
  - Create history list (paginated, 20 per page)
  - Create accuracy status indicators (correct/partial/incorrect/pending)
  - Create running accuracy percentage display
  - Create filter controls (competition, date, status)
  - Handle empty state and no-match-filter state
  - Verify: History displays correctly, filters work, accuracy calculates properly

- [x] 32. Build admin dashboard
  - Requirements: R17
  - Create DataSourceStatus panel (healthy/error per source)
  - Create RefreshControls (trigger data update, model retrain)
  - Create ModelVersionInfo display
  - Create SystemLogs viewer (50 most recent, filterable by level)
  - Implement admin role check (403 for non-admin)
  - Verify: Admin-only access enforced, refresh triggers work, logs display

## Phase 9: AI Integration

- [x] 33. Implement Amazon Bedrock integration for explanations
  - Requirements: R4, R21
  - Create apps/api/services/ai_service.py
  - Implement Bedrock Converse API client
  - Create prompt templates for prediction explanations
  - Create prompt templates for insight generation
  - Create prompt templates for user question answering
  - Implement 10-second timeout with fallback
  - Verify: Explanations reference actual data, fallback shows raw importance

- [x] 34. Implement AI Coach question-answering
  - Requirements: R4
  - Create POST /ai/ask endpoint
  - Pass prediction context + user question to Bedrock
  - Ensure response cites specific factors
  - Implement response length constraints (50-300 words)
  - Verify: Questions get contextual answers, no hallucination of data

## Phase 10: Data Pipeline & ML Models

- [x] 35. Implement data source adapters
  - Requirements: R12
  - Create abstract DataSourceInterface
  - Implement OpenFootball adapter (CSV/JSON parsing)
  - Implement football-data.org adapter (REST API with rate limiting)
  - Implement ClubElo adapter (Elo ratings endpoint)
  - Implement Kaggle data loader (historical results CSV)
  - Verify: Each adapter returns standardized data format

- [x] 36. Implement data pipeline orchestrator
  - Requirements: R12, R17
  - Create pipeline runner with scheduled/manual triggers
  - Implement data validation (missing fields, duplicates, outliers)
  - Implement error logging with source/record/reason
  - Implement retry logic (3 attempts, exponential backoff)
  - Implement S3 storage for processed datasets
  - Implement DynamoDB cache updates
  - Verify: Pipeline runs end-to-end, invalid records skipped, S3 updated

- [ ] 37. Train ML models
  - Requirements: R8, R17
  - Implement feature engineering from processed data
  - Train Logistic Regression, Random Forest, XGBoost, LightGBM
  - Implement chronological 80/20 train/test split
  - Calculate and store performance metrics
  - Implement model versioning with timestamp identifiers
  - Implement ensemble model (weighted average of all 4)
  - Verify: Models train successfully, metrics stored, ensemble produces valid predictions

## Phase 11: Infrastructure & Deployment

- [x] 38. Set up AWS CDK infrastructure
  - Requirements: R20
  - Create CDK app with stacks for: API (Lambda + API Gateway), Data (S3 + DynamoDB), Frontend (Amplify)
  - Define DynamoDB tables (Users, Predictions, Teams, Players, Matches, ModelMetrics)
  - Define S3 buckets (matchlens-data)
  - Define Lambda function with container image
  - Define API Gateway with routes
  - Verify: `cdk synth` produces valid CloudFormation template

- [x] 39. Set up CI/CD pipeline
  - Requirements: R20
  - Create .github/workflows/ci.yml (lint, type-check, test on PR)
  - Create .github/workflows/deploy.yml (build + deploy on main push)
  - Configure environment variables for dev/staging/prod
  - Implement deployment gates (all tests must pass)
  - Verify: CI runs on PR, deploy triggers on main merge

- [x] 40. Create Docker configuration for API
  - Requirements: R20
  - Create Dockerfile.api with Python 3.11, ML dependencies
  - Optimize layer caching for fast builds
  - Configure Lambda handler entry point
  - Verify: Docker image builds, runs locally, responds to requests

## Phase 12: Polish & Quality

- [x] 41. Implement loading skeletons and error states across all pages
  - Requirements: R15, R18
  - Add skeleton components matching content layout for every data-fetching section
  - Add error boundaries with retry options
  - Add empty states with helpful messaging
  - Verify: Every page has proper loading, error, and empty states

- [x] 42. Implement responsive design polish
  - Requirements: R15, R16
  - Test and fix all pages at 375px, 768px, 1920px
  - Ensure no horizontal scrolling at any breakpoint
  - Verify mobile navigation works correctly
  - Verify: Visual inspection at all breakpoints passes

- [x] 43. Implement accessibility
  - Requirements: R15
  - Add aria-labels to all chart visualizations
  - Ensure keyboard navigation works for all interactive elements
  - Add sr-only descriptions for data visualizations
  - Verify: Accessibility audit shows no critical violations

- [x] 44. Performance optimization
  - Requirements: R18
  - Implement TanStack Query caching (5-minute stale time)
  - Implement lazy loading for non-critical page components
  - Optimize chart rendering for large datasets
  - Implement API response caching in DynamoDB
  - Verify: Cached predictions return in <500ms, page loads are fast

- [x] 45. Create About page and documentation
  - Requirements: R16
  - Create About page explaining methodology
  - Create README.md with setup instructions, architecture overview
  - Document API endpoints
  - Verify: About page renders, README covers setup and architecture

## Notes

- **MVP Scope:** Phases 1-5 produce a working demo with prediction, Prediction Lab, AI explanations, and core visualizations
- **Sample Data:** Development uses static sample data (data/sample/); production uses S3 + data pipeline
- **Bedrock Dependency:** AI features (Tasks 33-34) require AWS credentials with Bedrock access; implement mock responses for local development
- **Model Training:** Task 37 requires processed historical data; can use Kaggle international results dataset for initial training
- **Infrastructure:** CDK deployment (Task 38) can be deferred for local development using Docker Compose
- **Testing:** Each task's "Verify" section defines minimum acceptance criteria; formal test suites built incrementally
- **Data Sources:** football-data.org has 10 req/min limit; implement caching to avoid hitting limits during development
