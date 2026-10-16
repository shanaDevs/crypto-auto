# Crypto Analysis Platform — Implementation Plan

Generated: 2026-10-16 | Version: 1.0

## Stack
- apps/web: Next.js 14 App Router, TypeScript, Tailwind, TradingView Lightweight Charts
- apps/api: NestJS 10, REST + WebSocket, OpenAPI, JWT auth, BullMQ
- services/quant: Python FastAPI, pandas/NumPy/scikit-learn
- packages/contracts: Shared Zod schemas + TypeScript types
- packages/mcp: Platform MCP server + outbound MCP client (SSE)
- PostgreSQL (candles, patterns, forecasts, news, users)
- Redis (BullMQ queues, caching)
- AI: OpenAI GPT-4o-mini via AIProvider interface

## Milestones
1. Scaffold + Auth + BTCUSDT live/demo vertical slice
2. 20-pair ingestion + 6 P0 detector families + chart overlays
3. Baselines + LightGBM quantile forecasts + walk-forward evaluation
4. News + AI explanations + MCP (SSE outbound client + read-only server)
5. Alerts + paper replay + monitoring + deployment
