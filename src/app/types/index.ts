// Para el evento de miniTicker del WebSocket de Binance
export interface MiniTickerEvent {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol (e.g., BTCUSDT)
  c: string; // Close price
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
}

// Estructura de datos que usaremos para los cards
export interface PriceData {
  symbol: string; // Símbolo base (e.g., BTC)
  pair: string; // Par completo (e.g., BTCUSDT)
  price: string;
  volume: string;
  high: string;
  low: string;
}

// Para los datos históricos de klines de Binance
// [timestamp, open, high, low, close, volume, ...]
export type Kline = [
  number,    // Kline open time
  string,    // Open price
  string,    // High price
  string,    // Low price
  string,    // Close price
  string,    // Volume
  number,    // Kline close time
  string,    // Quote asset volume
  number,    // Number of trades
  string,    // Taker buy base asset volume
  string,    // Taker buy quote asset volume
  string     // Ignore
];

// Estructura para los puntos del gráfico
export interface ChartDataPoint {
  time: string; // Fecha formateada para el eje X
  price: number; // Precio de cierre para el eje Y
}