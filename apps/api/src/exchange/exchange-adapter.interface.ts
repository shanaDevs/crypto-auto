/**
 * Exchange adapter interface.
 * All adapters must implement this contract.
 * Never mix CoinGecko aggregate prices into exchange OHLC series.
 */
export interface OHLCV {
  openTime: Date;    // UTC
  closeTime: Date;   // UTC
  open: string;      // decimal string
  high: string;
  low: string;
  close: string;
  volume: string;
  isClosed: boolean;
}

export interface TickUpdate {
  symbol: string;
  openTime: Date;
  closeTime: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  isClosed: boolean;
  receivedAt: Date;
}

export interface ExchangeAdapter {
  readonly name: string;
  readonly isDemo: boolean;

  /** Fetch historical closed candles (REST).
   *  Returns in ascending open_time order.
   *  Throws on provider error. */
  fetchHistory(symbol: string, timeframe: string, limit: number): Promise<OHLCV[]>;

  /** Subscribe to live candle updates via WebSocket.
   *  Calls onTick for each update; calls onError on unrecoverable error. */
  subscribe(
    symbol: string,
    timeframe: string,
    onTick: (tick: TickUpdate) => void,
    onError: (err: Error) => void,
  ): () => void;  // returns unsubscribe function

  /** Check provider connectivity */
  ping(): Promise<boolean>;
}
