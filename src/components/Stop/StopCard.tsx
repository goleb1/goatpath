import type { Stop } from '../../types/Event';
import { BeerGlass } from './BeerGlass';
import { Timer } from '../Timer/Timer';

interface StopCardProps {
  stop: Stop;
  isActive: boolean;
  showTimer?: boolean;
}

export function StopCard({ stop, isActive, showTimer = true }: StopCardProps) {
  const getStatusDisplay = () => {
    switch (stop.status) {
      case 'pending':
        return 'NOT STARTED';
      case 'active':
        return 'IN PROGRESS';
      case 'completed':
        return 'COMPLETED';
      default:
        return 'UNKNOWN';
    }
  };

  const getStatusColor = () => {
    switch (stop.status) {
      case 'pending':
        return 'text-retro-amber';
      case 'active':
        return 'text-retro-green';
      case 'completed':
        return 'text-retro-green/60';
      default:
        return 'text-retro-green';
    }
  };

  const getBorderColor = () => {
    if (isActive) return 'border-retro-amber shadow-lg shadow-retro-amber/20';
    switch (stop.status) {
      case 'completed':
        return 'border-retro-green/40';
      default:
        return 'border-retro-green';
    }
  };

  const handleLocationClick = () => {
    const fullAddress = `${stop.address}, Pittsburgh, PA`;
    const encodedAddress = encodeURIComponent(fullAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div className={`bg-retro-bg-light border-2 ${getBorderColor()} p-4 mb-4 transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-retro-green font-mono text-lg font-bold">
            {String(stop.position + 1).padStart(2, '0')}
          </div>
          <BeerGlass stop={stop} />
        </div>
        {showTimer && <Timer stop={stop} isActive={isActive} />}
      </div>

      {/* Stop Name */}
      <h3 className="text-xl font-bold text-retro-green mb-2 font-mono">
        {stop.name.toUpperCase()}
      </h3>

      {/* Address - Clickable */}
      <button
        onClick={handleLocationClick}
        className="text-retro-amber hover:text-retro-green transition-colors text-left font-mono text-sm mb-3 underline"
      >
        {stop.address}
      </button>

      {/* Status and Distance */}
      <div className="flex justify-between items-center">
        <div className={`font-mono text-sm font-bold ${getStatusColor()}`}>
          {getStatusDisplay()}
        </div>
        {stop.distanceToNext && (
          <div className="text-retro-green/60 font-mono text-sm">
            Next: {stop.distanceToNext}
          </div>
        )}
      </div>

      {/* Timestamps */}
      {(stop.arrivalTime || stop.departureTime) && (
        <div className="mt-3 pt-3 border-t border-retro-green/20">
          {stop.arrivalTime && (
            <div className="text-retro-green/60 font-mono text-xs">
              Arrived: {new Date(stop.arrivalTime).toLocaleTimeString()}
            </div>
          )}
          {stop.departureTime && (
            <div className="text-retro-green/60 font-mono text-xs">
              Departed: {new Date(stop.departureTime).toLocaleTimeString()}
            </div>
          )}
          {stop.duration && (
            <div className="text-retro-amber font-mono text-xs">
              Duration: {stop.duration} minutes
            </div>
          )}
        </div>
      )}
    </div>
  );
}