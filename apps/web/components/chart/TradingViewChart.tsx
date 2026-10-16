'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  ColorType,
  Time,
  IPriceLine,
  createSeriesMarkers,
} from 'lightweight-charts';
import { CandleData, PatternItem, ForecastItem } from '@/lib/api';
import { useThemeStore } from '@/store/themeStore';
import { useDemoTrade } from '@/store/useDemoTrade';

interface TradingViewChartProps {
  candles: CandleData[];
  patterns?: PatternItem[];
  activePattern?: PatternItem | null;
  onPatternSelect?: (pattern: PatternItem | null) => void;
  forecast?: ForecastItem;
  symbol: string;
  timeframe: string;
  showIndicators?: {
    ema20?: boolean;
    ema50?: boolean;
    ema200?: boolean;
    bollinger?: boolean;
    patterns?: boolean;
    forecast?: boolean;
  };
  onPatternClick?: (pattern: PatternItem) => void;
  height?: number;
}

export function TradingViewChart({
  candles,
  patterns = [],
  activePattern,
  onPatternSelect,
  forecast,
  symbol,
  timeframe,
  showIndicators = {
    ema20: true,
    ema50: true,
    ema200: false,
    bollinger: false,
    patterns: true,
    forecast: true,
  },
  onPatternClick,
  height = 540,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const forecastMedianRef = useRef<ISeriesApi<'Line'> | null>(null);
  const forecastUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const forecastLowerRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Pattern overlays & series markers refs
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const seriesMarkersRef = useRef<any>(null);
  const demoPriceLinesRef = useRef<IPriceLine[]>([]);
  const prevSymbolRef = useRef<string>(symbol);

  const { openTrades, openTrade, closeTrade } = useDemoTrade();
  const currentDemoTrade = openTrades.find((t) => t.symbol === symbol);

  const [internalSelectedPattern, setInternalSelectedPattern] = useState<PatternItem | null>(null);
  const [autoApply, setAutoApply] = useState<boolean>(true);

  // Derive active pattern: explicit activePattern, internal selection, or auto-apply top pattern
  const effectivePattern: PatternItem | null =
    activePattern || internalSelectedPattern || (autoApply && patterns.length > 0 ? patterns[0] : null);


  const { theme } = useThemeStore();
  const [crosshairPrice, setCrosshairPrice] = useState<{
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    change?: number;
  } | null>(null);

  // Compute Exponential Moving Average (EMA)
  const computeEMA = (data: CandleData[], period: number): LineData[] => {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((acc, val) => acc + val.close, 0) / period;
    const result: LineData[] = [{ time: data[period - 1].time as Time, value: Number(ema.toFixed(2)) }];

    for (let i = period; i < data.length; i++) {
      ema = data[i].close * k + ema * (1 - k);
      result.push({ time: data[i].time as Time, value: Number(ema.toFixed(2)) });
    }
    return result;
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';
    const bg = isDark ? '#0d0f14' : '#ffffff';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? '#1a1e27' : '#f3f4f6';
    const borderColor = isDark ? '#262d3d' : '#e5e7eb';

    // Initialize Chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: textColor,
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        vertLine: {
          color: isDark ? '#4b5563' : '#9ca3af',
          width: 1,
          style: 3, // dashed
          labelBackgroundColor: isDark ? '#1f2937' : '#e5e7eb',
        },
        horzLine: {
          color: isDark ? '#4b5563' : '#9ca3af',
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#1f2937' : '#e5e7eb',
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.22, // space for volume histogram
        },
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 14,
        barSpacing: 9,
        minBarSpacing: 3,
      },
    });

    chartRef.current = chart;

    // Candlestick Series (Teal for Bullish, Rose/Red for Bearish)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00c9a7',
      downColor: '#f43f5e',
      borderUpColor: '#00c9a7',
      borderDownColor: '#f43f5e',
      wickUpColor: '#00c9a7',
      wickDownColor: '#f43f5e',
    });
    candleSeriesRef.current = candleSeries;

    // Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // EMA 20 (Cyan/Teal)
    const ema20Series = chart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 1,
      title: 'EMA 20',
      priceScaleId: 'right',
    });
    ema20SeriesRef.current = ema20Series;

    // EMA 50 (Amber)
    const ema50Series = chart.addSeries(LineSeries, {
      color: '#fbbf24',
      lineWidth: 1,
      title: 'EMA 50',
      priceScaleId: 'right',
    });
    ema50SeriesRef.current = ema50Series;

    // EMA 200 (Purple)
    const ema200Series = chart.addSeries(LineSeries, {
      color: '#c084fc',
      lineWidth: 1,
      title: 'EMA 200',
      priceScaleId: 'right',
    });
    ema200SeriesRef.current = ema200Series;

    // Forecast Series (q50 Median, q90 Upper, q10 Lower)
    const forecastMedian = chart.addSeries(LineSeries, {
      color: '#10b981',
      lineWidth: 2,
      lineStyle: 2, // dashed
      title: 'q50 Forecast',
      priceScaleId: 'right',
    });
    forecastMedianRef.current = forecastMedian;

    const forecastUpper = chart.addSeries(LineSeries, {
      color: 'rgba(16, 185, 129, 0.4)',
      lineWidth: 1,
      lineStyle: 3, // dotted
      title: 'q90',
      priceScaleId: 'right',
    });
    forecastUpperRef.current = forecastUpper;

    const forecastLower = chart.addSeries(LineSeries, {
      color: 'rgba(239, 68, 68, 0.4)',
      lineWidth: 1,
      lineStyle: 3, // dotted
      title: 'q10',
      priceScaleId: 'right',
    });
    forecastLowerRef.current = forecastLower;

    // Series Markers Primitive
    try {
      seriesMarkersRef.current = createSeriesMarkers(candleSeries);
    } catch {}

    // Crosshair Subscriber
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        if (candles.length > 0) {
          const last = candles[candles.length - 1];
          setCrosshairPrice({
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
            volume: last.volume,
            change: Number((((last.close - last.open) / last.open) * 100).toFixed(2)),
          });
        }
        return;
      }

      const data = param.seriesData.get(candleSeries) as CandlestickData;
      if (data) {
        const change = Number((((data.close - data.open) / data.open) * 100).toFixed(2));
        setCrosshairPrice({
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          change,
        });
      }
    });

    // Resize Observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      priceLinesRef.current = [];
      seriesMarkersRef.current = null;
      chart.remove();
    };
  }, [theme, height]);

  // Update Data when candles, indicators, or forecasts change
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || candles.length === 0) return;

    // Format Candlestick Data
    const formattedCandles: CandlestickData[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current.setData(formattedCandles);

    // Format Volume Data
    if (volumeSeriesRef.current) {
      const formattedVolume: HistogramData[] = candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(0, 201, 167, 0.25)' : 'rgba(244, 63, 94, 0.25)',
      }));
      volumeSeriesRef.current.setData(formattedVolume);
    }

    // EMAs
    if (ema20SeriesRef.current) {
      if (showIndicators?.ema20) {
        ema20SeriesRef.current.setData(computeEMA(candles, 20));
      } else {
        ema20SeriesRef.current.setData([]);
      }
    }

    if (ema50SeriesRef.current) {
      if (showIndicators?.ema50) {
        ema50SeriesRef.current.setData(computeEMA(candles, 50));
      } else {
        ema50SeriesRef.current.setData([]);
      }
    }

    if (ema200SeriesRef.current) {
      if (showIndicators?.ema200) {
        ema200SeriesRef.current.setData(computeEMA(candles, 200));
      } else {
        ema200SeriesRef.current.setData([]);
      }
    }

    // Forecast Projection
    if (forecast && showIndicators?.forecast && candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const targetTime = (lastCandle.time + 3600) as Time; // 1h forward projection

      if (forecastMedianRef.current) {
        forecastMedianRef.current.setData([
          { time: lastCandle.time as Time, value: lastCandle.close },
          { time: targetTime, value: forecast.q50 },
        ]);
      }
      if (forecastUpperRef.current) {
        forecastUpperRef.current.setData([
          { time: lastCandle.time as Time, value: lastCandle.close },
          { time: targetTime, value: forecast.q90 },
        ]);
      }
      if (forecastLowerRef.current) {
        forecastLowerRef.current.setData([
          { time: lastCandle.time as Time, value: lastCandle.close },
          { time: targetTime, value: forecast.q10 },
        ]);
      }
    } else {
      forecastMedianRef.current?.setData([]);
      forecastUpperRef.current?.setData([]);
      forecastLowerRef.current?.setData([]);
    }

    // Set Default Crosshair Price
    const last = candles[candles.length - 1];
    setCrosshairPrice({
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      volume: last.volume,
      change: Number((((last.close - last.open) / last.open) * 100).toFixed(2)),
    });

    // Chart remains at user's current scroll/zoom position.
    // View only snaps to latest candle when user explicitly clicks '🎯 Focus Latest Candle'.
  }, [candles, showIndicators, forecast, symbol]);

  // ─── Automatic Usable Pattern Price Lines (Trigger, Stop Loss, Target 1, Geometry) ─
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    // 1. Clear existing pattern price lines safely
    priceLinesRef.current.forEach((line) => {
      try {
        series.removePriceLine(line);
      } catch {}
    });
    priceLinesRef.current = [];

    // 2. Only draw if patterns toggle is enabled and an effective pattern is available
    if (showIndicators?.patterns === false || !effectivePattern) return;

    const pat = effectivePattern;

    // A. Entry Trigger Level (Teal Dashed)
    if (pat.triggerPrice) {
      try {
        const line = series.createPriceLine({
          price: pat.triggerPrice,
          color: '#00c9a7',
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: `ENTRY TRIGGER: $${pat.triggerPrice.toLocaleString()}`,
        });
        priceLinesRef.current.push(line);
      } catch {}
    }

    // B. Invalidation Stop Loss Level (Rose Dotted)
    if (pat.invalidationPrice) {
      try {
        const line = series.createPriceLine({
          price: pat.invalidationPrice,
          color: '#f43f5e',
          lineWidth: 2,
          lineStyle: 1, // Dotted
          axisLabelVisible: true,
          title: `STOP LOSS: $${pat.invalidationPrice.toLocaleString()}`,
        });
        priceLinesRef.current.push(line);
      } catch {}
    }

    // C. Take Profit Target 1 (1:1.8 Risk-to-Reward Ratio, Cyan Dashed)
    if (pat.triggerPrice && pat.invalidationPrice) {
      const risk = Math.abs(pat.triggerPrice - pat.invalidationPrice);
      const isBull = pat.triggerPrice >= pat.invalidationPrice;
      const target1 = isBull ? pat.triggerPrice + risk * 1.8 : pat.triggerPrice - risk * 1.8;
      try {
        const line = series.createPriceLine({
          price: Number(target1.toFixed(2)),
          color: '#38bdf8',
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: `TARGET 1 (1:1.8 R:R): $${Number(target1.toFixed(2)).toLocaleString()}`,
        });
        priceLinesRef.current.push(line);
      } catch {}
    }

    // D. Structural Geometry (Neckline, S/R Zone Min/Max, Triangle Bounds)
    if (pat.coordinates) {
      if (pat.coordinates.neckline) {
        try {
          const line = series.createPriceLine({
            price: pat.coordinates.neckline,
            color: '#fbbf24',
            lineWidth: 1,
            lineStyle: 0, // Solid
            axisLabelVisible: true,
            title: `NECKLINE: $${pat.coordinates.neckline.toLocaleString()}`,
          });
          priceLinesRef.current.push(line);
        } catch {}
      } else if (pat.coordinates.zoneMin) {
        try {
          const line = series.createPriceLine({
            price: pat.coordinates.zoneMin,
            color: '#10b981',
            lineWidth: 1,
            lineStyle: 0, // Solid
            axisLabelVisible: true,
            title: `DEMAND FLOOR: $${pat.coordinates.zoneMin.toLocaleString()}`,
          });
          priceLinesRef.current.push(line);
        } catch {}
      } else if (pat.coordinates.resistance) {
        try {
          const line = series.createPriceLine({
            price: pat.coordinates.resistance,
            color: '#fbbf24',
            lineWidth: 1,
            lineStyle: 0, // Solid
            axisLabelVisible: true,
            title: `CEILING RESISTANCE: $${pat.coordinates.resistance.toLocaleString()}`,
          });
          priceLinesRef.current.push(line);
        } catch {}
      }
    }
  }, [effectivePattern, showIndicators?.patterns, candles]);

  // ─── Pattern Series Markers on Candlestick Anchor Bars ──────────────────────
  useEffect(() => {
    if (!seriesMarkersRef.current) return;
    if (showIndicators?.patterns === false || patterns.length === 0 || candles.length === 0) {
      try {
        seriesMarkersRef.current.setMarkers([]);
      } catch {}
      return;
    }

    try {
      const markers = patterns.slice(0, 5).map((pat) => {
        const anchorSec = pat.anchorTime
          ? Math.floor(new Date(pat.anchorTime).getTime() / 1000)
          : candles[candles.length - 1].time;

        let nearest = candles[0];
        let minDiff = Infinity;
        for (const c of candles) {
          const diff = Math.abs(c.time - anchorSec);
          if (diff < minDiff) {
            minDiff = diff;
            nearest = c;
          }
        }
        const isBull =
          pat.type.includes('bottom') || pat.type.includes('support') || pat.type.includes('bullish');

        return {
          time: nearest.time as Time,
          position: isBull ? ('belowBar' as const) : ('aboveBar' as const),
          color: isBull ? '#00c9a7' : '#f43f5e',
          shape: isBull ? ('arrowUp' as const) : ('arrowDown' as const),
          text: `${pat.typeLabel} (${pat.qualityScore}%)`,
        };
      });

      seriesMarkersRef.current.setMarkers(markers);
    } catch {}
  }, [patterns, showIndicators?.patterns, candles]);

  // Focus directly on the latest candles with proper padding
  const handleFocusLatest = () => {
    if (!chartRef.current || candles.length === 0) return;
    try {
      const timeScale = chartRef.current.timeScale();
      const total = candles.length;
      timeScale.setVisibleLogicalRange({
        from: Math.max(0, total - 75),
        to: total + 10,
      });
      timeScale.scrollToPosition(0, false);
    } catch {}
  };

  // ─── Active Demo Position Price Lines (Entry, TP, SL) ──────────────────────
  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    demoPriceLinesRef.current.forEach((line) => {
      try {
        series.removePriceLine(line);
      } catch {}
    });
    demoPriceLinesRef.current = [];

    if (!currentDemoTrade) return;

    try {
      const entryLine = series.createPriceLine({
        price: currentDemoTrade.entryPrice,
        color: '#38bdf8',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `DEMO ${currentDemoTrade.side}: $${currentDemoTrade.entryPrice.toLocaleString()}`,
      });
      demoPriceLinesRef.current.push(entryLine);

      const tpLine = series.createPriceLine({
        price: currentDemoTrade.takeProfit,
        color: '#00c9a7',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `DEMO TP: $${currentDemoTrade.takeProfit.toLocaleString()}`,
      });
      demoPriceLinesRef.current.push(tpLine);

      const slLine = series.createPriceLine({
        price: currentDemoTrade.stopLoss,
        color: '#f43f5e',
        lineWidth: 2,
        lineStyle: 1,
        axisLabelVisible: true,
        title: `DEMO SL: $${currentDemoTrade.stopLoss.toLocaleString()}`,
      });
      demoPriceLinesRef.current.push(slLine);
    } catch {}
  }, [currentDemoTrade]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Top Bar Floating Crosshair Stats */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 12,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '4px 10px',
          background: 'rgba(13, 15, 20, 0.75)',
          backdropFilter: 'blur(8px)',
          borderRadius: 6,
          border: '1px solid var(--bg-border)',
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {symbol} · {timeframe}
        </span>
        {crosshairPrice && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>
              O: <strong style={{ color: 'var(--text-primary)' }}>{crosshairPrice.open?.toFixed(2)}</strong>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              H: <strong style={{ color: '#00c9a7' }}>{crosshairPrice.high?.toFixed(2)}</strong>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              L: <strong style={{ color: '#f43f5e' }}>{crosshairPrice.low?.toFixed(2)}</strong>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              C: <strong style={{ color: (crosshairPrice.change ?? 0) >= 0 ? '#00c9a7' : '#f43f5e' }}>
                {crosshairPrice.close?.toFixed(2)}
              </strong>
            </span>
            <span
              style={{
                color: (crosshairPrice.change ?? 0) >= 0 ? '#00c9a7' : '#f43f5e',
                fontWeight: 600,
              }}
            >
              {(crosshairPrice.change ?? 0) >= 0 ? '+' : ''}
              {crosshairPrice.change}%
            </span>
          </>
        )}

        {/* Focus Latest Candle Quick Button */}
        <button
          onClick={handleFocusLatest}
          style={{
            background: 'rgba(0, 201, 167, 0.15)',
            border: '1px solid var(--accent-teal)',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--accent-teal)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.15s ease',
          }}
          title="Auto-scroll directly to latest live candle"
        >
          🎯 Focus Latest Candle
        </button>

        {/* Active Demo Trade Status Pill */}
        {currentDemoTrade && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid var(--accent-blue)',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 10,
            }}
          >
            <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
              DEMO {currentDemoTrade.side}:
            </span>
            <span
              style={{
                fontWeight: 700,
                color: currentDemoTrade.unrealizedPnl >= 0 ? 'var(--accent-teal)' : 'var(--accent-rose)',
              }}
            >
              {currentDemoTrade.unrealizedPnl >= 0 ? '+' : ''}${currentDemoTrade.unrealizedPnl.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Floating Interactive Pattern Heads-Up Display (Automatic Pattern Applied) */}
      {showIndicators?.patterns !== false && patterns.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 42,
            left: 12,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxWidth: 'calc(100% - 24px)',
          }}
        >
          {/* Pattern Switcher Pills Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: 'rgba(13, 15, 20, 0.85)',
                padding: '3px 6px',
                borderRadius: 4,
                border: '1px solid var(--bg-border)',
              }}
            >
              Detected ({patterns.length}):
            </span>

            {patterns.map((pat) => {
              const isSelected = effectivePattern?.id === pat.id;
              return (
                <button
                  key={pat.id}
                  onClick={() => {
                    setInternalSelectedPattern(pat);
                    onPatternSelect?.(pat);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: isSelected ? 'rgba(0, 201, 167, 0.18)' : 'rgba(22, 25, 32, 0.85)',
                    border: isSelected ? '1.5px solid var(--accent-teal)' : '1px solid var(--bg-border)',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 10px rgba(0, 201, 167, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{isSelected ? '✓' : '◎'}</span>
                  <span>{pat.typeLabel}</span>
                  <span
                    style={{
                      background: isSelected ? 'var(--accent-teal)' : 'var(--bg-secondary)',
                      color: isSelected ? '#0d0f14' : 'var(--text-muted)',
                      borderRadius: 3,
                      padding: '1px 4px',
                      fontWeight: 700,
                      fontSize: 9,
                    }}
                  >
                    {pat.qualityScore}%
                  </span>
                </button>
              );
            })}

            {/* Clear / Auto Toggle */}
            {effectivePattern ? (
              <button
                onClick={() => {
                  setInternalSelectedPattern(null);
                  setAutoApply(false);
                  onPatternSelect?.(null);
                }}
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#f43f5e',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
                title="Remove pattern lines from chart"
              >
                ✕ Clear Overlay
              </button>
            ) : (
              <button
                onClick={() => {
                  setAutoApply(true);
                  if (patterns.length > 0) {
                    setInternalSelectedPattern(patterns[0]);
                    onPatternSelect?.(patterns[0]);
                  }
                }}
                style={{
                  background: 'rgba(0, 201, 167, 0.1)',
                  border: '1px solid var(--accent-teal)',
                  color: 'var(--accent-teal)',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + Auto Apply Top Pattern
              </button>
            )}

            {/* Quick Demo Trade Button */}
            {currentDemoTrade ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid var(--accent-blue)',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 10,
                }}
              >
                <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
                  DEMO {currentDemoTrade.side} OPEN
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: currentDemoTrade.unrealizedPnl >= 0 ? 'var(--accent-teal)' : 'var(--accent-rose)',
                  }}
                >
                  {currentDemoTrade.unrealizedPnl >= 0 ? '+' : ''}${currentDemoTrade.unrealizedPnl.toFixed(2)}
                </span>
                <button
                  onClick={() => closeTrade(currentDemoTrade.id, currentDemoTrade.currentPrice, 'MANUAL')}
                  style={{
                    background: 'none',
                    border: '1px solid var(--accent-rose)',
                    borderRadius: 3,
                    color: 'var(--accent-rose)',
                    fontSize: 9,
                    padding: '1px 5px',
                    cursor: 'pointer',
                  }}
                >
                  Close Position
                </button>
              </div>
            ) : effectivePattern && effectivePattern.triggerPrice && effectivePattern.invalidationPrice ? (
              <button
                onClick={() => {
                  const isBull = effectivePattern.triggerPrice! >= effectivePattern.invalidationPrice!;
                  const risk = Math.abs(effectivePattern.triggerPrice! - effectivePattern.invalidationPrice!);
                  const tp = isBull ? effectivePattern.triggerPrice! + risk * 1.8 : effectivePattern.triggerPrice! - risk * 1.8;
                  openTrade({
                    symbol,
                    side: isBull ? 'LONG' : 'SHORT',
                    entryPrice: effectivePattern.triggerPrice!,
                    stopLoss: effectivePattern.invalidationPrice!,
                    takeProfit: Number(tp.toFixed(2)),
                    patternName: effectivePattern.typeLabel,
                    patternQuality: effectivePattern.qualityScore,
                    patternId: effectivePattern.id,
                    leverage: 10,
                  });
                }}
                style={{
                  background:
                    effectivePattern.triggerPrice >= effectivePattern.invalidationPrice
                      ? 'rgba(0, 201, 167, 0.25)'
                      : 'rgba(244, 63, 94, 0.25)',
                  border: `1px solid ${
                    effectivePattern.triggerPrice >= effectivePattern.invalidationPrice
                      ? 'var(--accent-teal)'
                      : '#f43f5e'
                  }`,
                  color:
                    effectivePattern.triggerPrice >= effectivePattern.invalidationPrice
                      ? 'var(--accent-teal)'
                      : '#f43f5e',
                  borderRadius: 4,
                  padding: '3px 10px',
                  fontSize: 10,
                  cursor: 'pointer',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 0 12px rgba(0, 201, 167, 0.25)',
                }}
                title={`Take simulated paper demo entry at marked price $${effectivePattern.triggerPrice}`}
              >
                ⚡ Auto-Take Entry from Marked Pattern (
                {effectivePattern.triggerPrice >= effectivePattern.invalidationPrice ? 'BUY LONG' : 'SELL SHORT'} @ $
                {effectivePattern.triggerPrice.toLocaleString()})
              </button>
            ) : null}
          </div>

          {/* Active Pattern Details Floating HUD */}
          {effectivePattern && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '6px 12px',
                background: 'rgba(13, 15, 20, 0.92)',
                backdropFilter: 'blur(10px)',
                borderRadius: 6,
                border: '1px solid rgba(0, 201, 167, 0.35)',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--accent-teal)',
                    boxShadow: '0 0 8px var(--accent-teal)',
                    display: 'inline-block',
                  }}
                />
                <strong style={{ color: 'var(--text-primary)' }}>{effectivePattern.typeLabel}</strong>
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background:
                      effectivePattern.lifecycle === 'confirmed'
                        ? 'rgba(0,201,167,0.15)'
                        : 'rgba(251,191,36,0.15)',
                    color: effectivePattern.lifecycle === 'confirmed' ? 'var(--accent-teal)' : '#fbbf24',
                    fontWeight: 700,
                  }}
                >
                  {effectivePattern.lifecycle.toUpperCase()}
                </span>
              </div>

              {effectivePattern.triggerPrice && (
                <span style={{ color: 'var(--text-muted)' }}>
                  Trigger:{' '}
                  <strong style={{ color: 'var(--accent-teal)' }}>
                    ${effectivePattern.triggerPrice.toLocaleString()}
                  </strong>
                </span>
              )}

              {effectivePattern.invalidationPrice && (
                <span style={{ color: 'var(--text-muted)' }}>
                  Stop:{' '}
                  <strong style={{ color: '#f43f5e' }}>
                    ${effectivePattern.invalidationPrice.toLocaleString()}
                  </strong>
                </span>
              )}

              {effectivePattern.triggerPrice && effectivePattern.invalidationPrice && (
                <>
                  {(() => {
                    const risk = Math.abs(
                      effectivePattern.triggerPrice - effectivePattern.invalidationPrice
                    );
                    const isBull = effectivePattern.triggerPrice >= effectivePattern.invalidationPrice;
                    const target = isBull
                      ? effectivePattern.triggerPrice + risk * 1.8
                      : effectivePattern.triggerPrice - risk * 1.8;
                    const pct = ((risk * 1.8) / effectivePattern.triggerPrice) * 100;
                    return (
                      <>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Target 1:{' '}
                          <strong style={{ color: '#38bdf8' }}>
                            ${target.toLocaleString(undefined, { maximumFractionDigits: 2 })} (+{pct.toFixed(1)}%)
                          </strong>
                        </span>
                        <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>
                          R:R 1:1.8
                        </span>

                        {!currentDemoTrade && (
                          <button
                            onClick={() => {
                              openTrade({
                                symbol,
                                side: isBull ? 'LONG' : 'SHORT',
                                entryPrice: effectivePattern.triggerPrice!,
                                stopLoss: effectivePattern.invalidationPrice!,
                                takeProfit: Number(target.toFixed(2)),
                                patternName: effectivePattern.typeLabel,
                                patternQuality: effectivePattern.qualityScore,
                                patternId: effectivePattern.id,
                                leverage: 10,
                              });
                            }}
                            style={{
                              background: isBull ? 'var(--accent-teal)' : 'var(--accent-rose)',
                              border: 'none',
                              color: '#0d0f14',
                              borderRadius: 3,
                              padding: '2px 8px',
                              fontSize: 10,
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            ⚡ Trade Marked Level
                          </button>
                        )}
                      </>
                    );
                  })()}
                </>
              )}

              <button
                onClick={() => onPatternClick && onPatternClick(effectivePattern)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-teal)',
                  fontSize: 10,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                View Evidence ↗
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chart Canvas Container */}
      <div ref={chartContainerRef} style={{ width: '100%', height: height }} />

      {/* Mandatory TradingView Lightweight Charts Attribution Notice */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          right: 8,
          fontSize: 9,
          color: 'var(--text-muted)',
          zIndex: 5,
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '0.04em',
        }}
      >
        Powered by TradingView Lightweight Charts™ · Numerical Pattern Detection by Quant Engine
      </div>
    </div>
  );
}
