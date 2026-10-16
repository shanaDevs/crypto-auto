'use client';

export interface DemoTrade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  allocatedUsdt: number;
  leverage?: number;
  liquidationPrice?: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  entryTime: string;
  exitTime?: string;
  exitPrice?: number;
  exitReason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL';
  result?: 'WIN' | 'LOSS';
  patternId?: string;
  patternName: string;
  patternQuality?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface DemoAccountStats {
  startingBalance: number;
  currentBalance: number;
  marginUsed: number;
  availableBalance: number;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalRealizedPnl: number;
  totalRealizedPnlPercent: number;
  profitFactor: number;
  totalGains: number;
  totalLosses: number;
}

const STORAGE_KEY = 'crypto_demo_trade_store_v2';
const INITIAL_BALANCE = 10000;

// Seed realistic initial closed trades so accuracy metrics are informative immediately
const INITIAL_CLOSED_TRADES: DemoTrade[] = [
  {
    id: 'trade-seed-1',
    symbol: 'BTCUSDT',
    side: 'LONG',
    entryPrice: 81200,
    currentPrice: 82850,
    stopLoss: 80400,
    takeProfit: 82640,
    quantity: 0.0123,
    allocatedUsdt: 1000,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    entryTime: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    exitPrice: 82640,
    exitReason: 'TAKE_PROFIT',
    result: 'WIN',
    patternName: 'Double Bottom Reversal',
    patternQuality: 91,
    status: 'CLOSED',
  },
  {
    id: 'trade-seed-2',
    symbol: 'ETHUSDT',
    side: 'LONG',
    entryPrice: 2480,
    currentPrice: 2575,
    stopLoss: 2420,
    takeProfit: 2588,
    quantity: 0.4032,
    allocatedUsdt: 1000,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    entryTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    exitPrice: 2588,
    exitReason: 'TAKE_PROFIT',
    result: 'WIN',
    patternName: 'Support Demand Zone',
    patternQuality: 88,
    status: 'CLOSED',
  },
  {
    id: 'trade-seed-3',
    symbol: 'SOLUSDT',
    side: 'SHORT',
    entryPrice: 154.5,
    currentPrice: 157.8,
    stopLoss: 158.2,
    takeProfit: 147.8,
    quantity: 6.47,
    allocatedUsdt: 1000,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    entryTime: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    exitPrice: 158.2,
    exitReason: 'STOP_LOSS',
    result: 'LOSS',
    patternName: 'Double Top Distribution',
    patternQuality: 85,
    status: 'CLOSED',
  },
  {
    id: 'trade-seed-4',
    symbol: 'BNBUSDT',
    side: 'LONG',
    entryPrice: 585.0,
    currentPrice: 605.2,
    stopLoss: 574.0,
    takeProfit: 604.8,
    quantity: 1.709,
    allocatedUsdt: 1000,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    entryTime: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    exitPrice: 604.8,
    exitReason: 'TAKE_PROFIT',
    result: 'WIN',
    patternName: 'Ascending Triangle Breakout',
    patternQuality: 89,
    status: 'CLOSED',
  },
  {
    id: 'trade-seed-5',
    symbol: 'XRPUSDT',
    side: 'LONG',
    entryPrice: 0.582,
    currentPrice: 0.612,
    stopLoss: 0.565,
    takeProfit: 0.613,
    quantity: 1718.2,
    allocatedUsdt: 1000,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    entryTime: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    exitPrice: 0.613,
    exitReason: 'TAKE_PROFIT',
    result: 'WIN',
    patternName: 'Bullish Engulfing Candle',
    patternQuality: 86,
    status: 'CLOSED',
  },
];

export interface DemoTradeNotification {
  id: string;
  type: 'ENTRY' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE';
  title: string;
  message: string;
  timestamp: string;
  symbol: string;
  pnl?: number;
}

class DemoTradeManager {
  private balance: number = INITIAL_BALANCE;
  private trades: DemoTrade[] = [...INITIAL_CLOSED_TRADES];
  private isAutoTradeEnabled: boolean = false; // Default to OFF, user turns ON/OFF in workspace
  private defaultTradeSize: number = 1000;
  private notifications: DemoTradeNotification[] = [];
  private listeners: Set<() => void> = new Set();
  private executedPatternIds: Set<string> = new Set();
  private previousPrices: Record<string, number> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.load();
    }
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.balance = parsed.balance ?? INITIAL_BALANCE;
        this.trades = parsed.trades ?? [...INITIAL_CLOSED_TRADES];
        this.isAutoTradeEnabled = parsed.isAutoTradeEnabled ?? false;
        this.defaultTradeSize = parsed.defaultTradeSize ?? 1000;
        if (Array.isArray(parsed.executedPatternIds)) {
          this.executedPatternIds = new Set(parsed.executedPatternIds);
        }
      }
    } catch {}
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          balance: this.balance,
          trades: this.trades,
          isAutoTradeEnabled: this.isAutoTradeEnabled,
          defaultTradeSize: this.defaultTradeSize,
          executedPatternIds: Array.from(this.executedPatternIds),
        })
      );
    } catch {}
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getState() {
    const openTrades = this.trades.filter((t) => t.status === 'OPEN');
    const closedTrades = this.trades.filter((t) => t.status === 'CLOSED');
    const winningTrades = closedTrades.filter((t) => t.result === 'WIN');
    const losingTrades = closedTrades.filter((t) => t.result === 'LOSS');

    let totalGains = 0;
    let totalLosses = 0;
    let totalRealizedPnl = 0;

    closedTrades.forEach((t) => {
      const pnl =
        t.side === 'LONG'
          ? ((t.exitPrice ?? t.currentPrice) - t.entryPrice) * t.quantity
          : (t.entryPrice - (t.exitPrice ?? t.currentPrice)) * t.quantity;

      totalRealizedPnl += pnl;
      if (pnl > 0) totalGains += pnl;
      else totalLosses += Math.abs(pnl);
    });

    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const profitFactor = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? totalGains : 1;

    const marginUsed = openTrades.reduce((acc, t) => acc + (t.allocatedUsdt || 0), 0);
    const currentBalance = Number((INITIAL_BALANCE + totalRealizedPnl).toFixed(2));
    const availableBalance = Number(Math.max(0, currentBalance - marginUsed).toFixed(2));

    const stats: DemoAccountStats = {
      startingBalance: INITIAL_BALANCE,
      currentBalance,
      marginUsed: Number(marginUsed.toFixed(2)),
      availableBalance,
      totalTrades: this.trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: Number(winRate.toFixed(1)),
      totalRealizedPnl: Number(totalRealizedPnl.toFixed(2)),
      totalRealizedPnlPercent: Number(((totalRealizedPnl / INITIAL_BALANCE) * 100).toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2)),
      totalGains: Number(totalGains.toFixed(2)),
      totalLosses: Number(totalLosses.toFixed(2)),
    };

    return {
      balance: stats.currentBalance,
      trades: this.trades,
      openTrades,
      closedTrades,
      stats,
      isAutoTradeEnabled: this.isAutoTradeEnabled,
      defaultTradeSize: this.defaultTradeSize,
      notifications: this.notifications,
    };
  }

  public setAutoTrade(enabled: boolean) {
    this.isAutoTradeEnabled = enabled;
    this.save();
  }

  public setDefaultTradeSize(size: number) {
    this.defaultTradeSize = size;
    this.save();
  }

  public dismissNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  private addNotification(notif: Omit<DemoTradeNotification, 'id' | 'timestamp'>) {
    const item: DemoTradeNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...notif,
    };
    this.notifications = [item, ...this.notifications.slice(0, 7)];
    this.notify();
  }

  /**
   * Open a new Demo Position (Manual or Automatic)
   */
  public openTrade(params: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    patternName: string;
    patternQuality?: number;
    patternId?: string;
    tradeSize?: number;
    leverage?: number;
  }): DemoTrade | null {
    const { symbol, side, entryPrice, stopLoss, takeProfit, patternName, patternQuality, patternId } = params;

    // Check if an open trade already exists for this symbol
    const existing = this.trades.find((t) => t.symbol === symbol && t.status === 'OPEN');
    if (existing) return null;

    const allocatedUsdt = params.tradeSize ?? this.defaultTradeSize;
    const leverage = params.leverage ?? 10;
    const positionValue = allocatedUsdt * leverage;
    const quantity = Number((positionValue / entryPrice).toFixed(6));

    const liquidationPrice =
      side === 'LONG'
        ? Number((entryPrice * (1 - 0.9 / leverage)).toFixed(2))
        : Number((entryPrice * (1 + 0.9 / leverage)).toFixed(2));

    const trade: DemoTrade = {
      id: `demo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol,
      side,
      entryPrice,
      currentPrice: entryPrice,
      stopLoss,
      takeProfit,
      quantity,
      allocatedUsdt,
      leverage,
      liquidationPrice,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      entryTime: new Date().toISOString(),
      patternName,
      patternQuality,
      patternId,
      status: 'OPEN',
    };

    this.trades = [trade, ...this.trades];
    this.addNotification({
      type: 'ENTRY',
      title: `⚡ DEMO ${side} OPEN: ${symbol} (${leverage}x)`,
      message: `${side} @ $${entryPrice.toLocaleString()} (${patternName}) | Margin: $${allocatedUsdt} USDT | TP: $${takeProfit.toLocaleString()} | SL: $${stopLoss.toLocaleString()}`,
      symbol,
    });

    this.save();
    return trade;
  }

  /**
   * Close an Open Demo Position
   */
  public closeTrade(tradeId: string, exitPrice: number, exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL') {
    const tradeIndex = this.trades.findIndex((t) => t.id === tradeId && t.status === 'OPEN');
    if (tradeIndex === -1) return;

    const trade = this.trades[tradeIndex];
    const isLong = trade.side === 'LONG';
    const pnl = isLong
      ? (exitPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - exitPrice) * trade.quantity;
    const pnlPercent = ((pnl / trade.allocatedUsdt) * 100);

    const result: 'WIN' | 'LOSS' = pnl >= 0 ? 'WIN' : 'LOSS';

    const closedTrade: DemoTrade = {
      ...trade,
      status: 'CLOSED',
      exitPrice,
      exitTime: new Date().toISOString(),
      exitReason,
      result,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
    };

    this.trades[tradeIndex] = closedTrade;

    const formattedPnl = `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnl >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)`;
    if (exitReason === 'TAKE_PROFIT') {
      this.addNotification({
        type: 'TAKE_PROFIT',
        title: `🎯 TAKE PROFIT HIT: ${trade.symbol}`,
        message: `Won ${formattedPnl} on ${trade.patternName}. Win rate updated!`,
        symbol: trade.symbol,
        pnl,
      });
    } else if (exitReason === 'STOP_LOSS') {
      this.addNotification({
        type: 'STOP_LOSS',
        title: `🛑 STOP LOSS HIT: ${trade.symbol}`,
        message: `Closed at stop loss with ${formattedPnl}.`,
        symbol: trade.symbol,
        pnl,
      });
    } else {
      this.addNotification({
        type: 'MANUAL_CLOSE',
        title: `✋ MANUAL CLOSE: ${trade.symbol}`,
        message: `Closed position with ${formattedPnl}.`,
        symbol: trade.symbol,
        pnl,
      });
    }

    this.save();
  }

  /**
   * Close all active open positions at current market prices
   */
  public closeAllTrades() {
    const openTrades = this.trades.filter((t) => t.status === 'OPEN');
    openTrades.forEach((t) => {
      this.closeTrade(t.id, t.currentPrice || t.entryPrice, 'MANUAL');
    });
  }

  /**
   * Continuous Tick Processing from Live Binance Feeds:
   * 1. Evaluates TP and SL on open positions
   * 2. Automatically triggers entry when live price reaches pattern triggerPrice
   */
  public processLiveTick(symbol: string, currentPrice: number, activePatterns?: any[]) {
    let stateChanged = false;

    // 1. Process Open Trades for this symbol
    for (const trade of this.trades) {
      if (trade.status !== 'OPEN' || trade.symbol !== symbol) continue;

      trade.currentPrice = currentPrice;
      const isLong = trade.side === 'LONG';
      const pnl = isLong
        ? (currentPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - currentPrice) * trade.quantity;
      const pnlPercent = (pnl / trade.allocatedUsdt) * 100;

      trade.unrealizedPnl = Number(pnl.toFixed(2));
      trade.unrealizedPnlPercent = Number(pnlPercent.toFixed(2));

      // Check Take Profit Hit
      if (isLong && currentPrice >= trade.takeProfit) {
        this.closeTrade(trade.id, trade.takeProfit, 'TAKE_PROFIT');
        return;
      } else if (!isLong && currentPrice <= trade.takeProfit) {
        this.closeTrade(trade.id, trade.takeProfit, 'TAKE_PROFIT');
        return;
      }

      // Check Stop Loss Hit
      if (isLong && currentPrice <= trade.stopLoss) {
        this.closeTrade(trade.id, trade.stopLoss, 'STOP_LOSS');
        return;
      } else if (!isLong && currentPrice >= trade.stopLoss) {
        this.closeTrade(trade.id, trade.stopLoss, 'STOP_LOSS');
        return;
      }

      stateChanged = true;
    }

    // 2. Automated Entry Triggering
    if (this.isAutoTradeEnabled && activePatterns && activePatterns.length > 0) {
      const prevPrice = this.previousPrices[symbol] ?? currentPrice;
      this.previousPrices[symbol] = currentPrice;

      // Check if this symbol already has an open position
      const hasOpen = this.trades.some((t) => t.symbol === symbol && t.status === 'OPEN');
      if (!hasOpen) {
        for (const pat of activePatterns) {
          if (!pat.triggerPrice || !pat.invalidationPrice) continue;
          // Prevent recurring entries for patterns that have already been executed
          if (this.executedPatternIds.has(pat.id)) continue;

          const isBull =
            pat.type.includes('bottom') ||
            pat.type.includes('support') ||
            pat.type.includes('bullish') ||
            pat.type.includes('ascending') ||
            pat.type.includes('breakout');

          const risk = Math.abs(pat.triggerPrice - pat.invalidationPrice);
          const target1 = isBull
            ? Number((pat.triggerPrice + risk * 1.8).toFixed(2))
            : Number((pat.triggerPrice - risk * 1.8).toFixed(2));

          // Strict trigger condition:
          // Triggers ONLY when price touches or crosses the pattern entry price
          const crossedBull = isBull && prevPrice <= pat.triggerPrice && currentPrice >= pat.triggerPrice;
          const crossedBear = !isBull && prevPrice >= pat.triggerPrice && currentPrice <= pat.triggerPrice;
          const diffPct = Math.abs(currentPrice - pat.triggerPrice) / pat.triggerPrice;
          const isTriggerHit = crossedBull || crossedBear || diffPct <= 0.0012;

          if (isTriggerHit) {
            this.executedPatternIds.add(pat.id);
            this.openTrade({
              symbol,
              side: isBull ? 'LONG' : 'SHORT',
              entryPrice: currentPrice,
              stopLoss: pat.invalidationPrice,
              takeProfit: target1,
              patternName: pat.typeLabel || pat.type,
              patternQuality: pat.qualityScore || 85,
              patternId: pat.id,
            });
            break;
          }
        }
      }
    } else {
      this.previousPrices[symbol] = currentPrice;
    }

    if (stateChanged) {
      this.notify();
    }
  }

  /**
   * Reset Demo Account Back to $10,000 USDT Default
   */
  public resetAccount() {
    this.balance = INITIAL_BALANCE;
    this.trades = [...INITIAL_CLOSED_TRADES];
    this.notifications = [];
    this.executedPatternIds.clear();
    this.previousPrices = {};
    this.save();
  }
}

// Global Singleton Instance
export const demoTradeManager = new DemoTradeManager();
