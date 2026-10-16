#!/usr/bin/env python3
"""
Crypto Analysis Platform — Quant Service
FastAPI + pandas + NumPy + scikit-learn

Endpoints:
  GET /health
  GET /indicators?symbol=BTCUSDT&timeframe=1h
  POST /patterns/detect
  POST /forecasts/baseline
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import math
import json
import logging
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("quant")

app = FastAPI(
    title="Crypto Analysis Quant Service",
    version="1.0.0",
    description="Deterministic indicators, pattern detection, and baseline forecasts",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Models ────────────────────────────────────────────────────────────────

class CandleData(BaseModel):
    open_time: str       # ISO UTC
    open: float
    high: float
    low: float
    close: float
    volume: float
    is_closed: bool = True


class IndicatorRequest(BaseModel):
    symbol: str
    timeframe: str
    candles: List[CandleData]


class PatternRequest(BaseModel):
    symbol: str
    timeframe: str
    candles: List[CandleData]


class ForecastRequest(BaseModel):
    symbol: str
    timeframe: str
    horizon: str   # '1h','4h','24h'
    candles: List[CandleData]


# ─── Health ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "quant",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ─── Indicators ────────────────────────────────────────────────────────────

def compute_ema(closes: list[float], period: int) -> list[Optional[float]]:
    """EMA using Wilder-style smoothing (alpha=2/(period+1))."""
    k = 2.0 / (period + 1)
    result = [None] * len(closes)
    if len(closes) < period:
        return result
    sma = sum(closes[:period]) / period
    result[period - 1] = sma
    for i in range(period, len(closes)):
        result[i] = closes[i] * k + result[i - 1] * (1 - k)
    return result


def compute_rsi(closes: list[float], period: int = 14) -> list[Optional[float]]:
    """RSI using Wilder smoothing. Returns None if insufficient history."""
    result = [None] * len(closes)
    if len(closes) < period + 1:
        return result
    gains = []
    losses = []
    for i in range(1, len(closes)):
        diff = closes[i] - closes[i - 1]
        gains.append(max(diff, 0))
        losses.append(max(-diff, 0))
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    for i in range(period, len(closes)):
        avg_gain = (avg_gain * (period - 1) + gains[i - 1]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i - 1]) / period
        if avg_loss == 0:
            result[i] = 100.0
        else:
            rs = avg_gain / avg_loss
            result[i] = 100 - (100 / (1 + rs))
    return result


def compute_atr(highs, lows, closes, period: int = 14) -> list[Optional[float]]:
    """ATR using Wilder smoothing."""
    result = [None] * len(closes)
    if len(closes) < period + 1:
        return result
    trs = []
    for i in range(1, len(closes)):
        tr = max(
            highs[i] - lows[i],
            abs(highs[i] - closes[i - 1]),
            abs(lows[i] - closes[i - 1]),
        )
        trs.append(tr)
    atr = sum(trs[:period]) / period
    result[period] = atr
    for i in range(period + 1, len(closes)):
        atr = (atr * (period - 1) + trs[i - 1]) / period
        result[i] = atr
    return result


def compute_macd(closes: list[float], fast=12, slow=26, signal=9):
    ema_fast = compute_ema(closes, fast)
    ema_slow = compute_ema(closes, slow)
    macd_line = [
        (f - s) if f is not None and s is not None else None
        for f, s in zip(ema_fast, ema_slow)
    ]
    valid_macd = [v for v in macd_line if v is not None]
    signal_vals = compute_ema(valid_macd, signal)
    # Re-align signal to full length
    start = macd_line.index(next(v for v in macd_line if v is not None))
    signal_full = [None] * len(closes)
    for i, v in enumerate(signal_vals):
        if start + i < len(signal_full):
            signal_full[start + i] = v
    histogram = [
        (m - s) if m is not None and s is not None else None
        for m, s in zip(macd_line, signal_full)
    ]
    return macd_line, signal_full, histogram


def compute_bollinger(closes: list[float], period=20, std_dev=2.0):
    result_mid = [None] * len(closes)
    result_upper = [None] * len(closes)
    result_lower = [None] * len(closes)
    for i in range(period - 1, len(closes)):
        window = closes[i - period + 1: i + 1]
        mid = sum(window) / period
        variance = sum((x - mid) ** 2 for x in window) / period
        std = math.sqrt(variance)
        result_mid[i] = mid
        result_upper[i] = mid + std_dev * std
        result_lower[i] = mid - std_dev * std
    return result_mid, result_upper, result_lower


def compute_rel_volume(volumes: list[float], period=20) -> list[Optional[float]]:
    """Relative volume: current bar volume / avg of previous N bars."""
    result = [None] * len(volumes)
    for i in range(period, len(volumes)):
        avg = sum(volumes[i - period: i]) / period
        result[i] = volumes[i] / avg if avg > 0 else None
    return result


@app.post("/indicators")
def compute_indicators(req: IndicatorRequest):
    if len(req.candles) < 2:
        raise HTTPException(status_code=400, detail="Insufficient candles (need at least 2)")

    # Only analyze closed candles
    closed = [c for c in req.candles if c.is_closed]
    if not closed:
        raise HTTPException(status_code=400, detail="No closed candles provided")

    opens = [c.open for c in closed]
    highs = [c.high for c in closed]
    lows = [c.low for c in closed]
    closes = [c.close for c in closed]
    volumes = [c.volume for c in closed]
    times = [c.open_time for c in closed]

    ema20 = compute_ema(closes, 20)
    ema50 = compute_ema(closes, 50)
    ema200 = compute_ema(closes, 200)
    rsi14 = compute_rsi(closes, 14)
    atr14 = compute_atr(highs, lows, closes, 14)
    macd_line, signal_line, histogram = compute_macd(closes)
    bb_mid, bb_upper, bb_lower = compute_bollinger(closes)
    rel_vol = compute_rel_volume(volumes)

    last = len(closes) - 1
    return {
        "symbol": req.symbol,
        "timeframe": req.timeframe,
        "candle_count": len(closed),
        "computed_at": datetime.now(timezone.utc).isoformat(),
        "latest": {
            "time": times[last],
            "close": closes[last],
            "ema_20": ema20[last],
            "ema_50": ema50[last],
            "ema_200": ema200[last],
            "rsi_14": rsi14[last],
            "atr_14": atr14[last],
            "macd": macd_line[last],
            "macd_signal": signal_line[last],
            "macd_histogram": histogram[last],
            "bb_mid": bb_mid[last],
            "bb_upper": bb_upper[last],
            "bb_lower": bb_lower[last],
            "rel_volume": rel_vol[last],
        },
        "series": {
            "times": times,
            "closes": closes,
            "ema_20": ema20,
            "ema_50": ema50,
            "ema_200": ema200,
            "rsi_14": rsi14,
            "atr_14": atr14,
            "macd": macd_line,
            "macd_signal": signal_line,
            "macd_histogram": histogram,
            "bb_mid": bb_mid,
            "bb_upper": bb_upper,
            "bb_lower": bb_lower,
            "rel_volume": rel_vol,
        },
        "warmup": {
            "ema_20": 20,
            "ema_50": 50,
            "ema_200": 200,
            "rsi_14": 15,
            "atr_14": 15,
            "macd": 34,
            "bollinger": 20,
            "rel_volume": 21,
        }
    }


# ─── Baseline Forecast ─────────────────────────────────────────────────────

@app.post("/forecasts/baseline")
def baseline_forecast(req: ForecastRequest):
    """
    Random walk + historical return distribution baselines.
    Not a trading signal. Clearly labeled as baseline.
    """
    closed = [c for c in req.candles if c.is_closed]
    if len(closed) < 20:
        raise HTTPException(status_code=400, detail="Need at least 20 closed candles")

    closes = [c.close for c in closed]
    returns = [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))]

    last_price = closes[-1]
    horizon_map = {"1h": 1, "4h": 4, "24h": 24}
    horizon_bars = horizon_map.get(req.horizon, 1)

    # Historical return distribution baseline
    sorted_returns = sorted(returns)
    n = len(sorted_returns)
    q10_return = sorted_returns[max(0, int(n * 0.10))]
    q50_return = sorted_returns[max(0, int(n * 0.50))]
    q90_return = sorted_returns[min(n-1, int(n * 0.90))]

    # Scale to horizon (sqrt of time)
    scale = math.sqrt(horizon_bars)
    q10 = last_price * (1 + q10_return * scale)
    q50 = last_price * (1 + q50_return * scale)
    q90 = last_price * (1 + q90_return * scale)

    return {
        "symbol": req.symbol,
        "timeframe": req.timeframe,
        "horizon": req.horizon,
        "model_type": "hist_return",
        "model_version": "baseline-v1",
        "last_observed_price": last_price,
        "q10": max(q10, 0.000001),
        "q50": max(q50, 0.000001),
        "q90": max(q90, 0.000001),
        "status": "baseline",
        "note": "Historical return distribution baseline. Not a trading signal. Not evidence of future performance.",
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("QUANT_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
