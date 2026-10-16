-- ============================================================
-- Crypto Analysis Platform — Initial Schema Migration
-- Version: 001  Date: 2026-10-16
-- Run: psql $DATABASE_URL -f 001_initial_schema.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users & Roles ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,  -- 'admin', 'analyst', 'viewer'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name) VALUES ('admin'), ('analyst'), ('viewer')
  ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id       UUID NOT NULL REFERENCES roles(id),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Assets (canonical) ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coingecko_id    TEXT UNIQUE,
  symbol          TEXT NOT NULL,
  name            TEXT NOT NULL,
  chain           TEXT,
  contract_addr   TEXT,
  news_aliases    TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Instruments (exchange-specific) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS instruments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exchange      TEXT NOT NULL DEFAULT 'binance',
  market_type   TEXT NOT NULL DEFAULT 'spot',
  base_asset    TEXT NOT NULL,
  quote_asset   TEXT NOT NULL DEFAULT 'USDT',
  symbol        TEXT NOT NULL,
  asset_id      UUID REFERENCES assets(id),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exchange, market_type, symbol)
);

-- Seed 20 default instruments
INSERT INTO instruments (exchange, market_type, base_asset, quote_asset, symbol, sort_order)
VALUES
  ('binance','spot','BTC','USDT','BTCUSDT',1),
  ('binance','spot','ETH','USDT','ETHUSDT',2),
  ('binance','spot','BNB','USDT','BNBUSDT',3),
  ('binance','spot','SOL','USDT','SOLUSDT',4),
  ('binance','spot','XRP','USDT','XRPUSDT',5),
  ('binance','spot','ADA','USDT','ADAUSDT',6),
  ('binance','spot','AVAX','USDT','AVAXUSDT',7),
  ('binance','spot','DOGE','USDT','DOGEUSDT',8),
  ('binance','spot','DOT','USDT','DOTUSDT',9),
  ('binance','spot','MATIC','USDT','MATICUSDT',10),
  ('binance','spot','LINK','USDT','LINKUSDT',11),
  ('binance','spot','UNI','USDT','UNIUSDT',12),
  ('binance','spot','ATOM','USDT','ATOMUSDT',13),
  ('binance','spot','LTC','USDT','LTCUSDT',14),
  ('binance','spot','NEAR','USDT','NEARUSDT',15),
  ('binance','spot','ARB','USDT','ARBUSDT',16),
  ('binance','spot','OP','USDT','OPUSDT',17),
  ('binance','spot','SUI','USDT','SUIUSDT',18),
  ('binance','spot','INJ','USDT','INJUSDT',19),
  ('binance','spot','TIA','USDT','TIAUSDT',20)
ON CONFLICT (exchange, market_type, symbol) DO NOTHING;

-- ─── Candles ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS candles (
  id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  instrument_id   UUID        NOT NULL REFERENCES instruments(id),
  timeframe       TEXT        NOT NULL,   -- '5m','15m','1h','4h','1d'
  open_time       TIMESTAMPTZ NOT NULL,
  close_time      TIMESTAMPTZ NOT NULL,
  open            NUMERIC(30,10) NOT NULL,
  high            NUMERIC(30,10) NOT NULL,
  low             NUMERIC(30,10) NOT NULL,
  close           NUMERIC(30,10) NOT NULL,
  volume          NUMERIC(30,10) NOT NULL,
  is_closed       BOOLEAN     NOT NULL DEFAULT FALSE,
  is_provisional  BOOLEAN     NOT NULL DEFAULT FALSE,
  source          TEXT        NOT NULL DEFAULT 'live',
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (instrument_id, timeframe, open_time),
  CONSTRAINT candles_ohlc_valid CHECK (high >= low AND high >= open AND high >= close AND low <= open AND low <= close),
  CONSTRAINT candles_volume_nonneg CHECK (volume >= 0)
);

CREATE INDEX IF NOT EXISTS idx_candles_instrument_tf_time
  ON candles(instrument_id, timeframe, open_time DESC);

CREATE INDEX IF NOT EXISTS idx_candles_close_time
  ON candles(close_time DESC);

-- Candle revisions (immutable history of corrections)
CREATE TABLE IF NOT EXISTS candle_revisions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id   UUID NOT NULL REFERENCES instruments(id),
  timeframe       TEXT NOT NULL,
  open_time       TIMESTAMPTZ NOT NULL,
  previous_close  NUMERIC(30,10) NOT NULL,
  new_close       NUMERIC(30,10) NOT NULL,
  reason          TEXT,
  revised_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Patterns ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patterns (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id     UUID NOT NULL REFERENCES instruments(id),
  timeframe         TEXT NOT NULL,
  type              TEXT NOT NULL,
  lifecycle         TEXT NOT NULL DEFAULT 'candidate',
  anchor_time       TIMESTAMPTZ NOT NULL,
  available_at      TIMESTAMPTZ NOT NULL,
  confirmed_at      TIMESTAMPTZ,
  invalidated_at    TIMESTAMPTZ,
  expired_at        TIMESTAMPTZ,
  coordinates       JSONB NOT NULL DEFAULT '{}',
  quality_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
  quality_components JSONB NOT NULL DEFAULT '{}',
  detector_version  TEXT NOT NULL,
  detector_params   JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patterns_instrument_tf
  ON patterns(instrument_id, timeframe, lifecycle, anchor_time DESC);

-- Pattern lifecycle events (immutable)
CREATE TABLE IF NOT EXISTS pattern_lifecycle_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id  UUID NOT NULL REFERENCES patterns(id),
  from_state  TEXT,
  to_state    TEXT NOT NULL,
  event_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata    JSONB
);

-- ─── Forecasts ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forecasts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id       UUID NOT NULL REFERENCES instruments(id),
  timeframe           TEXT NOT NULL,
  horizon             TEXT NOT NULL,    -- '1h','4h','24h'
  issued_at           TIMESTAMPTZ NOT NULL,
  data_cutoff         TIMESTAMPTZ NOT NULL,
  target_at           TIMESTAMPTZ NOT NULL,
  model_version       TEXT NOT NULL,
  model_type          TEXT NOT NULL,
  feature_version     TEXT,
  training_cutoff     TIMESTAMPTZ,
  last_observed_price NUMERIC(30,10) NOT NULL,
  q10                 NUMERIC(30,10) NOT NULL,
  q50                 NUMERIC(30,10) NOT NULL,
  q90                 NUMERIC(30,10) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  actual_price        NUMERIC(30,10),
  scored_at           TIMESTAMPTZ,
  pinball_loss        NUMERIC(10,6),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT forecasts_quantile_order CHECK (q10 <= q50 AND q50 <= q90)
);

CREATE INDEX IF NOT EXISTS idx_forecasts_instrument_issued
  ON forecasts(instrument_id, issued_at DESC);

-- ─── News Articles ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS articles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  excerpt         TEXT,
  url             TEXT NOT NULL UNIQUE,
  source          TEXT NOT NULL,
  published_at    TIMESTAMPTZ NOT NULL,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sentiment       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_news_links (
  article_id  UUID NOT NULL REFERENCES articles(id),
  asset_id    UUID NOT NULL REFERENCES assets(id),
  relevance   NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  PRIMARY KEY (article_id, asset_id)
);

-- ─── Analysis Snapshots ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analysis_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrument_id   UUID NOT NULL REFERENCES instruments(id),
  timeframe       TEXT NOT NULL,
  snapshot_at     TIMESTAMPTZ NOT NULL,
  indicators      JSONB NOT NULL DEFAULT '{}',
  pattern_ids     UUID[] NOT NULL DEFAULT '{}',
  forecast_ids    UUID[] NOT NULL DEFAULT '{}',
  article_ids     UUID[] NOT NULL DEFAULT '{}',
  snapshot_hash   TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AI Explanations ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS explanations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id         UUID NOT NULL REFERENCES analysis_snapshots(id),
  summary             TEXT NOT NULL,
  bullish_evidence    TEXT[] NOT NULL DEFAULT '{}',
  bearish_evidence    TEXT[] NOT NULL DEFAULT '{}',
  conflicting_signals TEXT[] NOT NULL DEFAULT '{}',
  triggers            TEXT[] NOT NULL DEFAULT '{}',
  invalidation        TEXT[] NOT NULL DEFAULT '{}',
  limitations         TEXT[] NOT NULL DEFAULT '{}',
  source_citations    TEXT[] NOT NULL DEFAULT '{}',
  model_version       TEXT NOT NULL,
  prompt_version      TEXT NOT NULL,
  prompt_tokens       INT NOT NULL DEFAULT 0,
  completion_tokens   INT NOT NULL DEFAULT 0,
  validation_passed   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Alert Rules & Deliveries ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alert_rules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  instrument_id   UUID NOT NULL REFERENCES instruments(id),
  type            TEXT NOT NULL,    -- 'price_cross','pattern_confirm','breakout','forecast','news'
  params          JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  cooldown_secs   INT NOT NULL DEFAULT 3600,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_deliveries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id         UUID NOT NULL REFERENCES alert_rules(id),
  triggered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence        JSONB NOT NULL DEFAULT '{}',
  delivered_at    TIMESTAMPTZ,
  channel         TEXT NOT NULL DEFAULT 'in_app',
  status          TEXT NOT NULL DEFAULT 'pending'
);

-- ─── Watchlists ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS watchlists (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  name            TEXT NOT NULL,
  instrument_ids  UUID[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Model Versions & Evaluation Runs ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS model_versions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  version         TEXT NOT NULL,
  type            TEXT NOT NULL,  -- 'quantile','classifier','baseline'
  trained_at      TIMESTAMPTZ,
  training_cutoff TIMESTAMPTZ,
  artifact_path   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, version)
);

CREATE TABLE IF NOT EXISTS evaluation_runs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_version_id      UUID NOT NULL REFERENCES model_versions(id),
  instrument_id         UUID REFERENCES instruments(id),
  horizon               TEXT,
  fold_count            INT,
  prediction_count      INT,
  avg_pinball_loss      NUMERIC(10,6),
  empirical_coverage_80 NUMERIC(5,3),
  interval_width_median NUMERIC(10,4),
  mae_median            NUMERIC(10,4),
  promoted              BOOLEAN NOT NULL DEFAULT FALSE,
  gate_passed           BOOLEAN NOT NULL DEFAULT FALSE,
  notes                 TEXT,
  run_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Audit Logs ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  resource    TEXT,
  resource_id UUID,
  metadata    JSONB,
  ip_addr     INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Provider Configs ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_configs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider    TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL,  -- 'exchange','news','ai','mcp'
  config      JSONB NOT NULL DEFAULT '{}',
  is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  last_ok_at  TIMESTAMPTZ,
  last_err_at TIMESTAMPTZ,
  last_error  TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
