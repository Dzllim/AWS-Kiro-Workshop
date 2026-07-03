# MatchLens

AI-powered football analytics platform that predicts match outcomes using statistical models, Monte Carlo simulation, and explainable AI.

## Architecture

```
User → Next.js Frontend → FastAPI API → Prediction Engine → S3/DynamoDB → Amazon Bedrock
```

## Tech Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + Recharts + Framer Motion
- **Backend:** Python FastAPI + Pydantic + pandas + numpy + scipy + scikit-learn
- **AI:** Amazon Bedrock (Converse API) for explanations
- **Storage:** AWS S3 (datasets) + DynamoDB (predictions, users)
- **Deployment:** AWS Amplify (frontend) + Lambda container (API) + API Gateway

## Project Structure

```
matchlens/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
├── packages/
│   └── prediction-engine/  # Python ML engine
├── data/
│   ├── raw/          # Raw source data
│   ├── processed/    # Processed datasets
│   └── sample/       # Sample dev data
├── infra/            # AWS CDK infrastructure
└── .kiro/specs/      # Spec-driven documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- AWS CLI configured (for Bedrock/S3/DynamoDB)

### Frontend
```bash
cd apps/web
npm install
npm run dev
```

### Backend
```bash
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Key Features

- **Match Prediction:** Win/Draw/Loss probabilities via Poisson + Monte Carlo (10,000 simulations)
- **Prediction Lab:** Interactive weight adjustment with instant recalculation
- **AI Coach:** Natural language explanations powered by Amazon Bedrock
- **Team Comparison:** Radar charts across 6 performance dimensions
- **What-If Scenarios:** Simulate injuries, red cards, weather changes
- **Match Timeline:** Minute-by-minute match simulation
- **Model Dashboard:** Accuracy, ROC curves, confusion matrices for 4 ML models

## Built for AWS Kiro BuildFest

MatchLens runs thousands of simulated matches using team strength, attacking output, defensive stability, and recent form to produce explainable probabilities.

This project showcases Kiro's Spec-Driven Development philosophy — from requirements to design to implementation with full traceability.
