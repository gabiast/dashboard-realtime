"use client"; 

import { ChartDataPoint } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface PriceChartProps {
  data: ChartDataPoint[];
  symbol: string | null;
  isLoading: boolean;
  intervalDisplay: string;
  timeframeDisplay: string; 
}

export function PriceChart({ data, symbol, isLoading, intervalDisplay, timeframeDisplay }: PriceChartProps) {
  // Mostrar "Cargando" solo si isLoading es true Y no hay datos previos que mostrar
  if (isLoading && data.length === 0) {
    return (
      <div className="col-span-4 p-4 border rounded-lg shadow-md bg-gray-800 text-gray-200 h-96 flex items-center justify-center">
        <p className="text-xl">Cargando gráfico para {symbol}...</p>
      </div>
    );
  }

  if (!symbol) {
    return (
      <div className="col-span-4 p-4 border rounded-lg shadow-md bg-gray-800 text-gray-200 h-96 flex items-center justify-center">
        <p className="text-xl">Selecciona una criptomoneda para ver el gráfico.</p>
      </div>
    );
  }
  
  if (data.length === 0 && !isLoading) {
      return (
        <div className="col-span-4 p-4 border rounded-lg shadow-md bg-gray-800 text-gray-200 h-96 flex items-center justify-center">
          <p className="text-xl">No hay datos disponibles para {symbol} ({timeframeDisplay} - {intervalDisplay}).</p>
        </div>
      );
  }
  
  const prices = data.map(p => p.price);
  const minY = Math.min(...prices);
  const maxY = Math.max(...prices);
  // Añadir un pequeño padding al eje Y para que la línea no toque los bordes superior/inferior
  const yAxisPadding = prices.length > 1 ? (maxY - minY) * 0.05 : Math.abs(maxY * 0.05) || 0.1;


  const chartTitle = `Precio de ${symbol?.replace('USDT','')} (${timeframeDisplay} - ${intervalDisplay})`;

  return (
    <div className="col-span-4 p-4 border rounded-lg shadow-md bg-gray-800 text-gray-200 h-96">
      <h3 className="text-lg font-semibold mb-4 text-center">{chartTitle}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis 
            dataKey="time" 
            stroke="#A0AEC0"
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            stroke="#A0AEC0"
            domain={[minY - yAxisPadding, maxY + yAxisPadding]}
            tickFormatter={(value) => `$${value.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: (symbol === 'DOGEUSDT' || symbol === 'XRPUSDT') ? 5 : 2 
            })}`}
            tick={{ fontSize: 10 }}
            width={80} // Ajustar ancho para números más largos
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568', borderRadius: '0.5rem' }}
            labelStyle={{ color: '#E2E8F0', marginBottom: '4px', fontWeight: 'bold' }} // Estilo para la hora
            itemStyle={{ color: '#63B3ED' }}
            // El 'label' del tooltip será el valor de 'time' (HH:mm) del punto de datos
            labelFormatter={(label) => `Hora: ${label}`} 
            formatter={(value: number) => {
              const formattedPrice = `$${value.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: (symbol === 'DOGEUSDT' || symbol === 'XRPUSDT') ? 5 : 2 
              })}`;
              return [formattedPrice, "Precio"];
            }}
          />
          <Legend wrapperStyle={{ color: '#A0AEC0' }} />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#63B3ED" 
            strokeWidth={2} 
            dot={false} // No mostrar puntos para 1440 datos, sería demasiado denso
            name={`Precio ${symbol?.replace('USDT','')}`} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}