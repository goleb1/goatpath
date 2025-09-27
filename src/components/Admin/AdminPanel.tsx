import { useEvent } from '../../context/useEventExport';
import { StopCard } from '../Stop/StopCard';

export function AdminPanel() {
  const { state, dispatch } = useEvent();
  
  if (!state.event) return null;

  const currentStop = state.event.stops[state.event.currentStopIndex];
  const nextStop = state.event.stops[state.event.currentStopIndex + 1];

  const handleArrival = () => {
    if (currentStop && currentStop.status === 'pending') {
      dispatch({
        type: 'UPDATE_STOP_STATUS',
        payload: {
          stopId: currentStop.id,
          status: 'active',
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const handleDeparture = () => {
    if (currentStop && currentStop.status === 'active') {
      dispatch({
        type: 'UPDATE_STOP_STATUS',
        payload: {
          stopId: currentStop.id,
          status: 'completed',
          timestamp: new Date().toISOString()
        }
      });
      
      // Auto-advance to next stop
      if (nextStop) {
        dispatch({ type: 'ADVANCE_TO_NEXT_STOP' });
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset entire event? This will clear all progress.')) {
      dispatch({ type: 'RESET_EVENT' });
    }
  };

  const canArrive = currentStop && currentStop.status === 'pending';
  const canDepart = currentStop && currentStop.status === 'active';

  return (
    <div className="min-h-screen bg-retro-bg p-4">
      {/* Header */}
      <div className="bg-retro-bg-light border-2 border-retro-amber p-4 mb-6">
        <h1 className="text-2xl font-bold text-retro-amber mb-2 font-mono text-center">
          ADMIN CONTROL PANEL
        </h1>
        <div className="text-retro-green font-mono text-center">
          ═══════════════════════════════
        </div>
        <div className="text-retro-green font-mono text-center mt-2">
          {state.event.title.toUpperCase()}
        </div>
      </div>

      {/* Current Stop Control */}
      {currentStop && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-retro-green mb-4 font-mono">
            CURRENT STOP: {currentStop.name.toUpperCase()}
          </h2>
          
          <StopCard 
            stop={currentStop} 
            isActive={true}
            showTimer={true}
          />

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onClick={handleArrival}
              disabled={!canArrive}
              className={`py-4 px-6 font-mono font-bold text-lg transition-colors ${
                canArrive
                  ? 'bg-retro-green text-retro-bg hover:bg-retro-amber'
                  : 'bg-retro-green/30 text-retro-bg/50 cursor-not-allowed'
              }`}
            >
              ✓ ARRIVED
            </button>
            
            <button
              onClick={handleDeparture}
              disabled={!canDepart}
              className={`py-4 px-6 font-mono font-bold text-lg transition-colors ${
                canDepart
                  ? 'bg-retro-amber text-retro-bg hover:bg-retro-green'
                  : 'bg-retro-amber/30 text-retro-bg/50 cursor-not-allowed'
              }`}
            >
              → DEPARTED
            </button>
          </div>
        </div>
      )}

      {/* Next Stop Preview */}
      {nextStop && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-retro-green mb-4 font-mono">
            NEXT STOP: {nextStop.name.toUpperCase()}
          </h2>
          <StopCard 
            stop={nextStop} 
            isActive={false}
            showTimer={false}
          />
        </div>
      )}

      {/* Event Complete */}
      {!nextStop && currentStop?.status === 'completed' && (
        <div className="bg-retro-bg-light border-2 border-retro-green p-6 text-center">
          <h2 className="text-2xl font-bold text-retro-green mb-2 font-mono">
            🎉 EVENT COMPLETE! 🎉
          </h2>
          <div className="text-retro-amber font-mono">
            All stops have been completed successfully!
          </div>
        </div>
      )}

      {/* Emergency Reset */}
      <div className="mt-8 pt-8 border-t border-retro-red/30">
        <button
          onClick={handleReset}
          className="w-full py-3 bg-retro-red text-white font-mono font-bold hover:bg-red-700 transition-colors"
        >
          ⚠ EMERGENCY RESET EVENT ⚠
        </button>
      </div>

      {/* Status Overview */}
      <div className="mt-6 bg-retro-bg-light border border-retro-green/30 p-4">
        <h3 className="text-retro-green font-mono font-bold mb-2">EVENT STATUS</h3>
        <div className="grid grid-cols-3 gap-4 text-center font-mono text-sm">
          <div>
            <div className="text-retro-green">COMPLETED</div>
            <div className="text-retro-amber">
              {state.event.stops.filter(s => s.status === 'completed').length}
            </div>
          </div>
          <div>
            <div className="text-retro-green">ACTIVE</div>
            <div className="text-retro-amber">
              {state.event.stops.filter(s => s.status === 'active').length}
            </div>
          </div>
          <div>
            <div className="text-retro-green">PENDING</div>
            <div className="text-retro-amber">
              {state.event.stops.filter(s => s.status === 'pending').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}