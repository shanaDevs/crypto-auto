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
} from 'lightweight-charts';
import { CandleData, PatternItem, ForecastItem } from '@/lib/api';
import { useThemeStore } from '@/store/themeStore';

interface TradingViewChartProps {
  candles: CandleData[];
  patterns?: PatternItem[];
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
  }, [candles, showIndicators, forecast]);

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
      </div>

      {/* Detected Patterns Overlay Floating Badges */}
      {showIndicators?.patterns && patterns.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 42,
            left: 12,
            zIndex: 10,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {patterns.slice(0, 3).map((pat) => (
            <button
              key={pat.id}
              onClick={() => onPatternClick && onPatternClick(pat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(22, 25, 32, 0.85)',
                border: '1px solid var(--accent-teal)',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 10,
                color: 'var(--accent-teal)',
                cursor: 'pointer',
              }}
              title="Click to view numerical evidence snapshot"
            >
              <span>◎</span>
              <span>{pat.typeLabel}</span>
              <span
                style={{
                  background: 'var(--accent-teal)',
                  color: '#0d0f14',
                  borderRadius: 3,
                  padding: '0 4px',
                  fontWeight: 700,
                  fontSize: 9,
                }}
              >
                {pat.qualityScore}
              </span>
            </button>
          ))}
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
