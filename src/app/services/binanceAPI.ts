import { Kline, ChartDataPoint } from '../types';
import { format } from 'date-fns';

const BINANCE_API_BASE_URL = 'https://api.binance.com/api/v3';

export async function fetchHistoricalData(
  pair: string,
  interval: string = '1m', // Intervalo de la vela
  durationHours: number = 24 // Cuántas horas hacia atrás
): Promise<ChartDataPoint[]> {
  try {
    const now = Date.now();
    const totalMinutesToFetch = durationHours * 60; // e.g., 24 * 60 = 1440 para 1m
    const maxKlinesPerRequest = 1000; // Límite típico de Binance API por solicitud

    let allKlines: Kline[] = [];
    let currentEndTime = now;
    let minutesFetchedSoFar = 0;

    // Bucle para obtener datos en lotes si es necesario
    while (minutesFetchedSoFar < totalMinutesToFetch) {
      const minutesInThisBatch = Math.min(
        totalMinutesToFetch - minutesFetchedSoFar,
        maxKlinesPerRequest
      );

      if (minutesInThisBatch <= 0) break;

      // Construir la URL para la solicitud de este lote
      // Queremos klines ANTES de currentEndTime
      const url = `${BINANCE_API_BASE_URL}/klines?symbol=${pair.toUpperCase()}&interval=${interval}&endTime=${currentEndTime}&limit=${minutesInThisBatch}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          `Binance API Error fetching batch for ${pair} (endTime: ${currentEndTime}, limit: ${minutesInThisBatch}):`,
          errorData
        );
        throw new Error(
          `Error fetching klines for ${pair}: ${response.statusText} - ${
            errorData.msg || ''
          }`
        );
      }
      const klinesBatch: Kline[] = await response.json();

      if (klinesBatch.length === 0) {
        // No más datos disponibles o se alcanzó el inicio del historial del par
        break;
      }

      // Los klines vienen del más antiguo al más nuevo en el lote.
      // Los vamos añadiendo al PRINCIPIO de `allKlines` porque estamos yendo hacia atrás en el tiempo.
      allKlines = [...klinesBatch, ...allKlines];
      minutesFetchedSoFar += klinesBatch.length;

      // El nuevo `currentEndTime` para la siguiente iteración (más antigua)
      // será el tiempo de apertura de la vela más antigua de este lote.
      currentEndTime = klinesBatch[0][0]; 

      // Medida de seguridad: si la API devuelve menos de lo esperado y aún faltan, podría ser el final del historial.
      if (klinesBatch.length < minutesInThisBatch && minutesFetchedSoFar < totalMinutesToFetch) {
        console.warn(`API returned fewer klines (${klinesBatch.length}) than requested (${minutesInThisBatch}) for ${pair}. May be end of history.`);
        break; 
      }
    }

    // Asegurarnos de que estén ordenados por tiempo (más antiguo primero)
    // Aunque la lógica de prepending debería mantener el orden, una clasificación final es segura.
    allKlines.sort((a, b) => a[0] - b[0]);

    // Si obtuvimos más de lo necesario (poco probable con esta lógica, pero por si acaso)
    if (allKlines.length > totalMinutesToFetch) {
      allKlines = allKlines.slice(allKlines.length - totalMinutesToFetch);
    }
    
    return allKlines.map((kline) => ({
      // kline[0] es el timestamp de apertura
      time: format(new Date(kline[0]), 'HH:mm'), // Formato para Hora:Minuto
      // kline[4] es el precio de cierre
      price: parseFloat(kline[4]),
    }));
  } catch (error) {
    console.error(`Failed to fetch historical data for ${pair}:`, error);
    return []; // Devolver array vacío en caso de error
  }
}