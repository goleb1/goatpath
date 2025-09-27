import type { Stop } from '../../types/Event';

interface BeerGlassProps {
  stop: Stop;
}

export function BeerGlass({ stop }: BeerGlassProps) {
  const getBeerLevel = () => {
    switch (stop.status) {
      case 'pending':
        return 'full';
      case 'active':
        return 'half';
      case 'completed':
        return 'empty';
      default:
        return 'full';
    }
  };

  const beerLevel = getBeerLevel();

  return (
    <div className="flex flex-col items-center">
      <div className="relative border-retro-amber" style={{ width: '2rem', height: '3rem' }}>
        {/* Beer glass outline */}
        <div className="absolute inset-0">
          {/* Beer liquid */}
          {beerLevel === 'full' && (
            <div className="absolute" style={{ bottom: 0, width: '100%', height: '100%', backgroundColor: '#ffbf00', opacity: 0.8 }}></div>
          )}
          {beerLevel === 'half' && (
            <div className="absolute" style={{ bottom: 0, width: '100%', height: '50%', backgroundColor: '#ffbf00', opacity: 0.6 }}></div>
          )}
          {/* Foam on top */}
          {(beerLevel === 'full' || beerLevel === 'half') && (
            <div className="absolute" style={{ top: 0, width: '100%', height: '0.25rem', backgroundColor: 'white', opacity: 0.9 }}></div>
          )}
        </div>
        {/* Glass handle */}
        <div className="absolute border-retro-amber" style={{ right: 0, top: '33.33%', width: '0.5rem', height: '1rem', borderLeft: 'none', borderRadius: '0 0.25rem 0.25rem 0' }}></div>
      </div>
      
      {/* Status indicator */}
      <div className="text-xs retro-amber" style={{ marginTop: '0.25rem' }}>
        {beerLevel === 'full' && '●●●'}
        {beerLevel === 'half' && '●●○'}
        {beerLevel === 'empty' && '○○○'}
      </div>
    </div>
  );
}