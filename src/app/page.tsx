"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBinanceWebSocket } from './hooks/useBinanceWebSocket';
import { PriceCard } from './components/PriceCard';
import { PriceChart } from './components/PriceChart';
import { fetchHistoricalData } from './services/binanceAPI';
import { PriceData, ChartDataPoint } from './types';

const SYMBOLS_TO_DISPLAY: Array<keyof ReturnType<typeof useBinanceWebSocket>> = ['BTC', 'ETH', 'XRP', 'DOGE'];
const CHART_REFRESH_INTERVAL_MS = 60 * 1000; // 1 minuto en milisegundos

export default function HomePage() {
  const livePrices = useBinanceWebSocket();
  const [selectedSymbolData, setSelectedSymbolData] = useState<PriceData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const chartUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadChartData = useCallback(async (pair: string, isInitialLoad: boolean = true) => {
    if (isInitialLoad) {
      setIsLoadingChart(true);
    }
    try {
      const historicalData = await fetchHistoricalData(pair, '1m', 24); // 1m interval, last 24 hours
      setChartData(historicalData);
    } catch (error) {
      console.error(`Error fetching historical data for chart (${pair}):`, error);
      setChartData([]); // Limpiar en caso de error
    } finally {
      if (isInitialLoad) {
        setIsLoadingChart(false);
      }
    }
  }, []); // loadChartData es estable y no necesita dependencias

  const clearChartUpdateInterval = useCallback(() => {
    if (chartUpdateIntervalRef.current) {
      clearInterval(chartUpdateIntervalRef.current);
      chartUpdateIntervalRef.current = null;
    }
  }, []);

  const handleCardSelect = useCallback(async (symbolData: PriceData) => {
    clearChartUpdateInterval();

    if (selectedSymbolData?.pair === symbolData.pair) {
      // Deseleccionar si se hace clic en el mismo card
      setSelectedSymbolData(null);
      setChartData([]);
    } else {
      setSelectedSymbolData(symbolData);
      await loadChartData(symbolData.pair, true); // Carga inicial con indicador de carga

      // Configurar nuevo intervalo para el símbolo seleccionado
      chartUpdateIntervalRef.current = setInterval(async () => {
        console.log(`Auto-refreshing chart data for ${symbolData.pair}...`);
        // Para las actualizaciones automáticas, no mostramos el spinner completo (isInitialLoad = false)
        // para una experiencia de usuario más fluida.
        await loadChartData(symbolData.pair, false); 
      }, CHART_REFRESH_INTERVAL_MS);
    }
  }, [selectedSymbolData, loadChartData, clearChartUpdateInterval]);

  // Limpiar el intervalo cuando el componente se desmonte
  useEffect(() => {
    return () => {
      clearChartUpdateInterval();
    };
  }, [clearChartUpdateInterval]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 bg-gray-900 text-white">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-center">Binance Crypto Dashboard</h1>
      </header>

      <section className="w-full max-w-6xl mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SYMBOLS_TO_DISPLAY.map((symbolKey) => {
            const priceInfo = livePrices[symbolKey];
            return priceInfo ? (
              <PriceCard
                key={priceInfo.pair}
                data={priceInfo}
                isSelected={selectedSymbolData?.pair === priceInfo.pair}
                onClick={() => handleCardSelect(priceInfo)}
              />
            ) : (
              <div key={symbolKey} className="p-4 border rounded-lg shadow-md bg-gray-800 text-gray-200 animate-pulse">
                Cargando {symbolKey}...
              </div>
            );
          })}
        </div>
      </section>

      <section className="w-full max-w-6xl">
        <div className="grid grid-cols-1">
           <PriceChart 
             data={chartData} 
             symbol={selectedSymbolData?.pair || null}
             isLoading={isLoadingChart && chartData.length === 0} // Solo mostrar loading si no hay datos previos
             // Nuevas props para dar contexto al gráfico
             intervalDisplay="1m" 
             timeframeDisplay="Últimas 24h"
           />
        </div>
      </section>
      
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Datos de precios en tiempo real vía Binance WebSocket.</p>
        <p>Datos históricos vía Binance REST API. Gráfico se actualiza cada minuto.</p>
      </footer>
    </main>
  );
}