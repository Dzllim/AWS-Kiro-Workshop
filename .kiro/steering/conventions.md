# MatchLens Project Conventions

## Architecture
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Backend: FastAPI (Python 3.11+) + Pydantic v2
- Prediction Engine: packages/prediction-engine/ (Poisson + Monte Carlo + Elo)
- AI Explanations: Amazon Bedrock Converse API (NOT for predictions)
- Storage: S3 (datasets) + DynamoDB (predictions, users)

## Coding Standards

### Frontend
- Use `"use client"` directive only for interactive components
- Use TanStack Query for all API calls (5-min stale time)
- Use Framer Motion for animations (200-500ms transitions)
- All charts use Recharts library
- Follow shadcn/ui component patterns
- Dark mode is the default theme

### Backend
- All request/response models use Pydantic v2
- All routes in apps/api/routes/
- Business logic in apps/api/services/
- Prediction math in packages/prediction-engine/
- JWT auth with bcrypt (cost 12) for passwords
- Rate limiting: 100/min auth, 30/min unauth

### Prediction Engine
- Predictions are deterministic (given same inputs + seed)
- Win + Draw + Loss always sum to 100% (±0.1%)
- Over + Under for each threshold sum to 1.0
- Monte Carlo uses minimum 10,000 simulations
- xG formula: base_rate × attack_strength × defence_weakness

## File Naming
- React components: PascalCase.tsx
- API routes: snake_case.py
- Types/interfaces: types.ts (shared)
- Utilities: utils.ts / utils.py

## Git Conventions
- Branch naming: feature/task-N-description
- Commit messages: "feat(scope): description" or "fix(scope): description"
