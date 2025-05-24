import { useEffect, useState, useRef } from 'react';
import { MiniTickerEvent, PriceData } from '../types';

const WEBSOCKET_URL = 'wss://stream.binance.com:9443/ws';
const SYMBOLS_TO_TRACK = ['BTC', 'ETH', 'XRP', 'DOGE']; // Símbolos base
const PAIRS_TO_TRACK = SYMBOLS_TO_TRACK.map(s => `${s.toLowerCase()}usdt`); // Pares completos para el stream

interface InitialPriceState {
  [key: string]: PriceData;
}

export function useBinanceWebSocket() {
  const [prices, setPrices] = useState<InitialPriceState>(() => {
    const initial: InitialPriceState = {};
    SYMBOLS_TO_TRACK.forEach(symbol => {
      initial[symbol] = {
        symbol: symbol,
        pair: `${symbol}USDT`,
        price: '0',
        volume: '0',
        high: '0',
        low: '0',
      };
    });
    return initial;
  });
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const streams = PAIRS_TO_TRACK.map(pair => `${pair}@miniTicker`).join('/');
    const fullUrl = `${WEBSOCKET_URL}/${streams}`;

    ws.current = new WebSocket(fullUrl);

    ws.current.onopen = () => {
      console.log('Binance WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as MiniTickerEvent | { stream: string; data: MiniTickerEvent };
        
        let tickerData: MiniTickerEvent;

        // El stream combinado devuelve un objeto con 'stream' y 'data'
        if ('stream' in data && data.data) {
          tickerData = data.data;
        } else {
          // Si es un solo stream (aunque no lo usamos así aquí), podría venir directo
          tickerData = data as MiniTickerEvent;
        }
        
        if (tickerData && tickerData.s) {
          const symbolBase = tickerData.s.replace('USDT', ''); // e.g., BTCUSDT -> BTC
          
          setPrices(prevPrices => ({
            ...prevPrices,
            [symbolBase]: {
              symbol: symbolBase,
              pair: tickerData.s,
              price: parseFloat(tickerData.c).toFixed(symbolBase === 'DOGE' || symbolBase === 'XRP' ? 4 : 2),
              volume: parseFloat(tickerData.v).toFixed(2),
              high: parseFloat(tickerData.h).toFixed(symbolBase === 'DOGE' || symbolBase === 'XRP' ? 4 : 2),
              low: parseFloat(tickerData.l).toFixed(symbolBase === 'DOGE' || symbolBase === 'XRP' ? 4 : 2),
            },
          }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('Binance WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('Binance WebSocket disconnected');
    };

    // Cleanup en el desmontaje del componente
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return prices;
}