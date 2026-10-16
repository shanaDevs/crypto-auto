# Antigravity implementation prompt

Copy the prompt below into Antigravity. Attach `Crypto_Analysis_Development_Plan.docx` and `Crypto_Analysis_SRS.docx` if file attachments are supported. This prompt is also usable independently.

---

You are the lead full stack and quantitative engineer building my Crypto Analysis Platform. Create a working application in stages, including data ingestion, automatic numerical chart pattern detection, automatic pattern drawings, forecast charts, coin specific news, evidence based AI explanations and MCP integration. This is an analysis and paper evaluation application. Do not implement order execution.

## 1. Working approach

First inspect the existing repository and its instructions. Preserve existing working code. If the repository is empty, scaffold the structure below. Before editing, write a short implementation plan and a requirement checklist to `docs/implementation-plan.md`. Record assumptions and integration blockers in `docs/setup-decisions.md`.

Implement one verified vertical slice at a time: one pair flowing from a provider through persisted closed candles to numerical analysis and a visible chart. Then expand coverage. Do not stop with mock screens. Do not claim incomplete integrations or unmeasured model accuracy work. Continue independently on adapters, fixtures and demo mode if live credentials are unavailable, and state the exact remaining setup.

Read official documentation for the installed dependency versions. Pin compatible versions and commit a lockfile. Run meaningful checks for each stage; report commands, results and limitations. Do not substitute random data for live data or label generated demo results as real predictions.

## 2. Stack and repository

- `apps/web`: Next.js, TypeScript, Tailwind, accessible reusable UI and TradingView Lightweight Charts with custom pattern and forecast primitives. Preserve required NOTICE and visible attribution. Do not assume an embedded TradingView widget supplies numerical pattern detection.
- `apps/api`: NestJS, validated REST endpoints, OpenAPI, authentication, authorization and browser WebSocket updates.
- `services/quant`: Python FastAPI with pandas, NumPy and scikit learn for deterministic indicators, pattern detection, backtests and forecast evaluation. Model training runs separately from real time analysis.
- `packages/contracts`: shared schemas and generated clients where useful.
- `packages/mcp`: scoped read only MCP tool definitions and adapters.
- PostgreSQL for application and candle data; Redis and BullMQ for durable jobs and caching. Use time partitions and indexes before adding an optional time series extension.
- `infra`: Docker Compose, environment examples without secrets, health checks and VPS or CapRover deployment instructions.
- `tests/fixtures`: deterministic numerical fixtures, provider responses and causal replay datasets.
- S3 compatible storage for model artifacts, database backups and exports.

## 3. Initial scope

Default to 20 configurable liquid USDT spot instruments from one exchange, starting with BTCUSDT and ETHUSDT during development. Use 5m, 15m, 1h, 4h and 1d chart intervals and 1h, 4h and 24h forecast horizons. Persist UTC timestamps and interval boundaries. Display Asia/Colombo by default with an explicit timezone label.

Use an exchange adapter for REST history and live candles. Binance spot is an initial candidate; make the provider configurable and verify current availability and limits. Use CoinGecko only for canonical metadata and aggregate context. Never mix aggregate prices into an exchange specific OHLC series. Evaluate a licensed news provider such as CryptoPanic or approved publisher feeds; verify actual endpoints, quotas and display rights instead of inventing access.

Create a deterministic demo mode that works without keys and has a persistent DEMO badge. Production live mode must show configuration errors, empty results and stale data honestly. Do not embed production secrets in the browser.

## 4. Ingestion and continuous automation

Separate canonical assets from exchange instruments. Instrument identity includes exchange, market type, base, quote and exchange symbol. Token identity may require chain and contract address. Resolve news and CoinGecko aliases to canonical IDs; ticker symbols alone are not unique.

Backfill history, subscribe to live updates, maintain provisional candles and finalize exactly one record per instrument, timeframe and open time. Validate OHLC consistency, nonnegative volume, ordering and timestamps. Analyze closed candles only. Do not silently fill missing bars as real market observations.

Implement heartbeat handling, planned reconnects where required, exponential backoff with jitter, quota handling, duplicate suppression, out of order handling and REST reconciliation of gaps. Retain source corrections as revisions. Block confirmed alerts and forecasts while necessary input is stale or gapped.

Trigger analysis with idempotent jobs keyed by instrument, timeframe, close time and analysis version. Keep workers running when no browser is open. Poll news every five minutes only if permitted. Run forecasts on eligible 1h and 4h closes; schedule training independently. Use bounded retries and visible dead letter jobs.

Mark a live quote delayed after 15 seconds without an update. Mark a candle stream stale if its expected closed candle has not arrived within 30 seconds of close. Make both thresholds configurable. Record upstream outages separately from platform health.

## 5. Numerical indicators and automatic patterns

Implement EMA 20/50/200, RSI 14 and ATR 14 using documented Wilder smoothing, MACD 12/26/9, Bollinger Bands 20 with two standard deviations and relative volume against the previous 20 bars. Specify warmup and variance conventions; return insufficient history instead of fake zeros.

P0 detector families:

1. Support and resistance zones from clusters of confirmed pivots.
2. Double tops and double bottoms.
3. Ascending, descending and symmetrical triangles.
4. Upward and downward channels.
5. Range breakouts and retests.
6. Bullish and bearish engulfing candles.

P1 adds head and shoulders, flags, pennants, wedges, triple tops or bottoms and RSI divergence only after individual tests and empirical evaluation.

Use only data available at detection time. Default confirmed pivots require three closed candles on each side: an anchor at t is available only at t plus three bars. Store both anchor time and available_at. Never backdate an alert to the anchor.

Initial double top or bottom rule: pivots separated by 5 to 80 bars, price difference no more than 0.75 ATR at the second pivot, intervening extreme forms the neckline, and a close at least 0.25 ATR past the neckline confirms. Configure the optional confirmation volume threshold against the prior 20 bars.

Trendlines need at least three separated touches within 0.5 ATR. Triangles need converging boundaries, at least two touches on each side and 10 to 100 bars of structure. Channels need approximately parallel boundaries, at least three touches per side and documented residual limits. Range breakouts need a close at least 0.25 ATR beyond a boundary established before the breakout; retest deadline is ten bars. Support or resistance zones need three touches. Engulfing candles use opposite real body directions and full body enclosure with configured equality and body size rules.

Before implementing each detector, document its exact parameter values, minimum history, tie rules, confirmation, invalidation, expiry and deduplication logic in a versioned configuration. These initial heuristics are not evidence of profitability.

Persist candidate, confirmed, invalidated and expired lifecycle events. Keep historical states immutable. Output timestamp and price coordinates for trendlines, zones, neckline, trigger and invalidation. Draw these automatically with chart primitives. Keep drawings aligned during zoom, resize and timeframe changes. Clicking a drawing opens its numerical evidence and detector version.

Report rule fit as a quality score from 0 to 100 with visible components. Do not call it a win probability. Show historical success rates only with an explicit outcome definition, sample size and evaluation period.

## 6. Forecasts and future chart paths

Start with a random walk point baseline and a historical return distribution baseline. Then research horizon specific gradient boosted quantile models on returns. Features may include lagged returns, indicators, volume, volatility, market regime and time aligned BTC context. Fit scalers and feature selection on training folds only. Exclude news from predictive training until point in time historical collection is available.

Return forecast ID, instrument, horizon, issued_at, data_cutoff, target_at, model and feature versions, training cutoff, last observed price and ordered q10/q50/q90 price estimates. Display median and an intended central 80 percent prediction interval only beyond the last observed candle. Make the observed and projected boundary clear. Intermediate interpolated lines are guides, not independent future observations. Do not render forecasts as actual future candles.

Show conditional bullish and bearish scenarios with trigger, invalidation and expiry. Do not invent scenario probabilities. If a calibrated classifier is enabled, define neutral using a band of plus or minus 0.25 times trailing 20 bar return standard deviation scaled by square root of horizon bars, computed as of the issue time. Persist the threshold and show up, neutral and down probabilities summing to one.

Use chronological walk forward evaluation with an embargo at least as long as the maximum prediction horizon. Reserve an untouched final test period. Require at least three folds and 200 completed predictions per reported horizon. Smaller coin or regime subgroups must be marked insufficient.

Before learned quantile model promotion, require average held out pinball loss at least 5 percent below the historical distribution baseline and empirical coverage between 75 and 85 percent for the intended 80 percent interval. Report interval width, median absolute error and uncertainty too. Probability models additionally require Brier score improvement over empirical class priors and expected calibration error no greater than 0.10 with documented binning. These are engineering release gates, not promises of trading accuracy.

Keep baseline forecasts clearly labeled and report their coverage. If validation is insufficient, show unavailable or experimental status and suppress unsupported calibrated probabilities. Save every published forecast before its target; never rewrite it after the result. Score actual outcomes only when target data is valid. Keep model and prompt versions.

## 7. News and AI explanations

For each article store permitted title and excerpt, canonical URL, source, publication time, first_seen_at, fetched_at, mapped coin IDs, relevance and optional sentiment. Disambiguate names and tickers. Deduplicate URLs and syndicated titles; group copies. Show no relevant news when none exists. Sentiment describes article tone, not future price direction. Historical replay may use articles only after recorded first_seen_at.

AI should explain a frozen numerical snapshot and approved news excerpts. It must not calculate authoritative prices, invent pattern anchors, replace quantitative forecasts or assign unsupported probabilities. Validate structured output with fields for summary, bullish evidence, bearish evidence, conflicting signals, triggers, invalidation, limitations and source citations. Reject unsupported numbers or citations and keep the underlying analysis usable.

Treat news and tool output as untrusted content. Embedded instructions must not alter tools, reveal secrets or change configuration. Record model, prompt version, snapshot hash, token usage and validation result. Cache explanations by immutable snapshot and prompt version. Use on demand or material change generation, daily budgets and timeouts rather than calling AI for every candle. The numerical scanner must work when AI is disabled.

## 8. My ChatGPT and MCP integration

I already have a ChatGPT AI MCP service, but its capabilities are not specified. Implement discovery and configuration rather than assuming it offers inference. Document the server URL, transport, authentication, tools and schemas required from me; do not ask me to paste secrets into chat.

Implement two separate roles:

- Outbound MCP client: connect to my approved server using supported transport, scoped credentials and an allowlisted tool set. Use a verified inference tool only if it actually exists. Otherwise use a separately configured server side AI provider through an `AIProvider` interface. Consult current official OpenAI documentation for its supported tools and structured response path.
- Platform MCP server: expose `get_market_snapshot`, `get_detected_patterns`, `get_forecast`, `get_coin_news` and `get_analysis_evidence` as authorized read tools. Scope by user and validate limits, instrument, cutoff and snapshot IDs.

MCP is a tool and context protocol, not an inference model. Do not assume my ChatGPT connection authorizes unattended hosted inference. Keep the adapter disabled with a clear setup state until capability and credential checks pass. No shell, arbitrary SQL, arbitrary URL fetch, order placement or administrator tools may be exposed to the model.

## 9. UI and application endpoints

Create these pages: dashboard, coin workspace, pattern scanner, forecast archive, news centre, alerts, paper research, AI assistant and admin settings. Use a compact professional terminal interface, a charcoal theme with teal and muted red, a light theme, small sparklines and clear typography. The coin chart should dominate the workspace; put evidence and news in collapsible panels. Include keyboard controls and text alternatives. Use status text in addition to color.

Support loading, empty, error, stale, backfilling, unavailable and demo states. Show timeframe conflicts and invalidated setups, not only successful signals. Make failure reasons actionable without leaking secrets.

Publish bounded and paginated endpoints for `/v1/instruments`, `/v1/candles`, `/v1/patterns`, `/v1/forecasts`, `/v1/assets/{id}/news`, `/v1/analyses`, `/v1/explanations`, `/v1/alerts` and `/v1/jobs/{id}`. Use 202 plus job ID for queued work. Validate all inputs and support idempotency keys for enqueued mutations. WebSocket events include candle.updated, candle.closed, analysis.ready, pattern.changed, alert.created and provider.status with reconnect recovery.

## 10. Storage security and operations

Create migrations for users, roles, assets, instruments, candles, candle revisions, features, patterns, lifecycle events, forecasts, outcomes, articles, asset news links, snapshots, explanations, watchlists, alert rules, alert deliveries, model versions, evaluation runs, provider configs, jobs and audit logs. Preserve input cutoff and version references. Use decimal source prices, unique candle keys and time indexes.

Use TLS, secure HttpOnly sessions, CSRF protection where applicable, strong authentication, administrator protection and ownership enforcement for API, stream and MCP access. Put secrets in deployment configuration and redact logs. Restrict provider and MCP endpoints with DNS, redirect and egress checks to prevent SSRF; block metadata and unapproved private addresses. Enforce size limits, quotas, bounded retries and circuit breakers.

Add metrics for freshness, gaps, queue lag, scan latency, errors, forecast calibration, model drift, AI usage and alert delivery. Back up PostgreSQL nightly to encrypted S3 compatible storage with 30 daily versions; test restore. Keep database ports private. Document RPO of 24 hours and RTO of 4 hours for the pilot. Initial retention: candles 12 months, forecasts 24 months and logs 90 days, subject to provider rights and configurable limits.

## 11. Alerts paper testing and verification

Create price crossing, pattern confirmation, breakout, forecast threshold and relevant news alerts. In app delivery first; design optional email or Telegram adapters. Store evidence snapshot, event time, cooldown and delivery status. Use durable event deduplication, and provider idempotency where available; document any external delivery uncertainty. Suppress stale data triggers.

Replay causal data with next eligible bar execution, configurable fees, spread and slippage. When an OHLC bar contains both target and stop and sequence is unknown, apply a conservative loss first policy or consistently report ambiguity. Report drawdown, exposure, sample counts and net outcomes. Pattern hit rate is not profitability.

Required tests: positive and negative numerical fixtures for every detector; indicator parity; future truncation invariance; delayed pivot availability; candle duplicate and gap recovery; forecast ordering and immutability; chronological folds and embargo; news ambiguity and point in time availability; prompt injection; unsupported AI number rejection; MCP scope checks; cross user authorization; duplicate alert events; provider 429 and timeout; AI outage; backup restoration; chart overlays under zoom and resize.

Proposed pilot targets: cached API p95 below 500 ms at 100 concurrent dashboard users; 1,000 candle chart load p95 below 3 seconds on a recorded desktop and network profile; analysis p95 below 15 seconds after a valid candle close is received for 20 pairs and five intervals. Measure rather than assume these targets pass.

## 12. Delivery order and completion

1. Scaffold, contracts, migrations, auth and one pair live or explicit demo vertical slice.
2. Reliable ingestion, scanner, six detector families and automatic overlays.
3. Baselines, forecast archive, walk forward evaluation and guarded research models.
4. Coin news, AI adapter and both MCP roles with discovery and security checks.
5. Alerts, paper replay, monitoring, load tests and deployment documentation.

At every milestone update the checklist with implemented, verified, blocked and pending items. Deliver source code, migrations, `.env.example`, container configuration, setup guide, provider contracts, model evaluation report, operations guide and test results. State precisely which live providers and models were actually tested. Do not claim that the product predicts the market with guaranteed accuracy.

Start by inspecting the repository and writing the implementation plan, then build the first vertical slice.
