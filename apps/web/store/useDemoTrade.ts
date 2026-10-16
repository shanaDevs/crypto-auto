'use client';

import { useEffect, useState } from 'react';
import { demoTradeManager } from './demoTradeStore';

export function useDemoTrade() {
  const [state, setState] = useState(() => demoTradeManager.getState());

  useEffect(() => {
    // Sync initial state on mount in case localStorage loaded client-side
    setState(demoTradeManager.getState());

    const unsubscribe = demoTradeManager.subscribe(() => {
      setState(demoTradeManager.getState());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...state,
    openTrade: demoTradeManager.openTrade.bind(demoTradeManager),
    closeTrade: demoTradeManager.closeTrade.bind(demoTradeManager),
    closeAllTrades: demoTradeManager.closeAllTrades.bind(demoTradeManager),
    setAutoTrade: demoTradeManager.setAutoTrade.bind(demoTradeManager),
    setDefaultTradeSize: demoTradeManager.setDefaultTradeSize.bind(demoTradeManager),
    resetAccount: demoTradeManager.resetAccount.bind(demoTradeManager),
    dismissNotification: demoTradeManager.dismissNotification.bind(demoTradeManager),
    processLiveTick: demoTradeManager.processLiveTick.bind(demoTradeManager),
  };
}
