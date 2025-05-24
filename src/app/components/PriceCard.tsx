import { PriceData } from '../types';

interface PriceCardProps {
  data: PriceData;
  isSelected: boolean;
  onClick: () => void;
}

export function PriceCard({ data, isSelected, onClick }: PriceCardProps) {
  if (!data) return null;

  const formatPrice = (priceStr: string) => {
    const priceNum = parseFloat(priceStr);
    if (isNaN(priceNum)) return 'N/A';
    // Más decimales para DOGE y XRP
    if (data.symbol === 'DOGE' || data.symbol === 'XRP') {
      return priceNum.toFixed(4);
    }
    return priceNum.toFixed(2);
  };

  const formatVolume = (volumeStr: string) => {
    const volumeNum = parseFloat(volumeStr);
    if (isNaN(volumeNum)) return 'N/A';
    return volumeNum.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 border rounded-lg shadow-md cursor-pointer transition-all duration-200 ease-in-out
                  ${isSelected ? 'bg-blue-500 text-white scale-105' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
    >
      <h3 className="text-xl font-bold mb-2">{data.symbol}/USDT</h3>
      <p className="text-2xl font-semibold">
        ${formatPrice(data.price)}
      </p>
      <div className="mt-2 text-xs">
        <p>Vol: {formatVolume(data.volume)}</p>
        <p>Max (24h): ${formatPrice(data.high)}</p>
        <p>Min (24h): ${formatPrice(data.low)}</p>
      </div>
    </div>
  );
}