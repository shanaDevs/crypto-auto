# Crypto Analysis Platform — Deployment & Operations Guide

## 1. Quick Start with Docker Compose

Ensure Docker and Docker Compose are installed on your host.

```bash
# 1. Clone repository & configure environment
cp .env.example .env

# 2. Start PostgreSQL, Redis, Quant Service, API, and Web
docker compose -f infra/docker-compose.yml up -d --build

# 3. Verify container health
docker compose -f infra/docker-compose.yml ps
```

Services exposed:
- **Web UI**: `http://localhost:3000`
- **REST + WebSocket API**: `http://localhost:3001` (Swagger docs at `/docs`)
- **FastAPI Quant Engine**: `http://localhost:8001` (Docs at `/docs`)
- **Platform MCP Server**: Port 3002 (SSE)
- **PostgreSQL**: Port 5432
- **Redis**: Port 6379

---

## 2. Model Context Protocol (MCP) Integration

The platform provides two MCP roles:

### Role 1: Platform MCP Server (Port 3002)
Authorized read-only access to 5 platform tools:
1. `get_market_snapshot`: OHLCV, indicators, quote staleness
2. `get_detected_patterns`: Confirmed patterns with coordinates and quality scores
3. `get_forecast`: Quantile projections (q10, q50, q90) and directional probabilities
4. `get_coin_news`: Sanitized, canonical asset-mapped wire items
5. `get_analysis_evidence`: Immutable snapshot hashes and indicator inputs

Security guards enforce read-only execution. No arbitrary SQL, shell commands, or order placement.

### Role 2: Outbound MCP Client
Connects to external MCP servers using SSE transport.
SSRF guards strictly block loopback, link-local (169.254.169.254), and private subnets in production.
Fallback to server-side OpenAI `gpt-4o-mini` is automatically enabled when an outbound MCP server is not configured.

---

## 3. Disaster Recovery & Operational Targets

- **Recovery Point Objective (RPO)**: 24 Hours (Nightly automated pg_dump to encrypted S3 bucket).
- **Recovery Time Objective (RTO)**: 4 Hours (Container redeployment and snapshot restoration).
- **Data Retention**:
  - Closed candles: 12 months rolling
  - Forecasts & outcomes: 24 months rolling
  - Application audit logs: 90 days rolling
- **Staleness Safeguards**:
  - Live quote marked delayed after 15 seconds without tick.
  - Closed candle stream marked stale after 30 seconds past boundary.
  - Alert triggers automatically suppressed when staleness thresholds are exceeded.
