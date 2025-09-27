import React from 'react';
import { useEvent } from '../../context/EventContext';

export function SimpleAdminPanel() {
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
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a', 
      padding: '1rem',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        border: '2px solid #ffbf00', 
        padding: '1rem', 
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#ffbf00', 
          marginBottom: '0.5rem' 
        }}>
          ADMIN CONTROL PANEL
        </h1>
        <div style={{ color: '#00ff00', fontSize: '0.875rem' }}>
          ═══════════════════════════════
        </div>
        <div style={{ color: '#00ff00', marginTop: '0.5rem' }}>
          {state.event.title.toUpperCase()}
        </div>
      </div>

      {/* Current Stop Control */}
      {currentStop && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 'bold', 
            color: '#00ff00', 
            marginBottom: '1rem' 
          }}>
            CURRENT STOP: {currentStop.name.toUpperCase()}
          </h2>
          
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            border: '2px solid #ffbf00', 
            padding: '1rem',
            marginBottom: '1rem',
            boxShadow: '0 0 20px rgba(255, 191, 0, 0.2)'
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: '#00ff00', 
              marginBottom: '0.5rem' 
            }}>
              {currentStop.name.toUpperCase()}
            </h3>
            <div style={{ 
              color: '#ffbf00', 
              fontSize: '0.875rem',
              marginBottom: '0.75rem'
            }}>
              📍 {currentStop.address}
            </div>
            <div style={{ 
              fontSize: '0.875rem', 
              fontWeight: 'bold',
              color: currentStop.status === 'active' ? '#00ff00' : '#ffbf00'
            }}>
              {currentStop.status === 'pending' ? 'NOT STARTED' : 
               currentStop.status === 'active' ? 'IN PROGRESS' : 'COMPLETED'}
            </div>
          </div>

          {/* Control Buttons */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={handleArrival}
              disabled={!canArrive}
              style={{
                padding: '1rem 1.5rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 'bold',
                fontSize: '1.125rem',
                border: 'none',
                cursor: canArrive ? 'pointer' : 'not-allowed',
                backgroundColor: canArrive ? '#00ff00' : 'rgba(0, 255, 0, 0.3)',
                color: canArrive ? '#0a0a0a' : 'rgba(10, 10, 10, 0.5)',
                transition: 'all 0.15s ease'
              }}
            >
              ✓ ARRIVED
            </button>
            
            <button
              onClick={handleDeparture}
              disabled={!canDepart}
              style={{
                padding: '1rem 1.5rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 'bold',
                fontSize: '1.125rem',
                border: 'none',
                cursor: canDepart ? 'pointer' : 'not-allowed',
                backgroundColor: canDepart ? '#ffbf00' : 'rgba(255, 191, 0, 0.3)',
                color: canDepart ? '#0a0a0a' : 'rgba(10, 10, 10, 0.5)',
                transition: 'all 0.15s ease'
              }}
            >
              → DEPARTED
            </button>
          </div>
        </div>
      )}

      {/* Next Stop Preview */}
      {nextStop && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 'bold', 
            color: '#00ff00', 
            marginBottom: '1rem' 
          }}>
            NEXT STOP: {nextStop.name.toUpperCase()}
          </h2>
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            border: '2px solid #00ff00', 
            padding: '1rem'
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: '#00ff00', 
              marginBottom: '0.5rem' 
            }}>
              {nextStop.name.toUpperCase()}
            </h3>
            <div style={{ 
              color: '#ffbf00', 
              fontSize: '0.875rem',
              marginBottom: '0.75rem'
            }}>
              📍 {nextStop.address}
            </div>
          </div>
        </div>
      )}

      {/* Event Complete */}
      {!nextStop && currentStop?.status === 'completed' && (
        <div style={{ 
          backgroundColor: '#1a1a1a', 
          border: '2px solid #00ff00', 
          padding: '1.5rem', 
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#00ff00', 
            marginBottom: '0.5rem' 
          }}>
            🎉 EVENT COMPLETE! 🎉
          </h2>
          <div style={{ color: '#ffbf00' }}>
            All stops have been completed successfully!
          </div>
        </div>
      )}

      {/* Status Overview */}
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        border: '1px solid rgba(0, 255, 0, 0.3)', 
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          EVENT STATUS
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1rem', 
          textAlign: 'center',
          fontSize: '0.875rem'
        }}>
          <div>
            <div style={{ color: '#00ff00' }}>COMPLETED</div>
            <div style={{ color: '#ffbf00' }}>
              {state.event.stops.filter(s => s.status === 'completed').length}
            </div>
          </div>
          <div>
            <div style={{ color: '#00ff00' }}>ACTIVE</div>
            <div style={{ color: '#ffbf00' }}>
              {state.event.stops.filter(s => s.status === 'active').length}
            </div>
          </div>
          <div>
            <div style={{ color: '#00ff00' }}>PENDING</div>
            <div style={{ color: '#ffbf00' }}>
              {state.event.stops.filter(s => s.status === 'pending').length}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Reset */}
      <div style={{ 
        marginTop: '2rem', 
        paddingTop: '2rem', 
        borderTop: '1px solid rgba(255, 0, 0, 0.3)' 
      }}>
        <button
          onClick={handleReset}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#ff0000',
            color: 'white',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          ⚠ EMERGENCY RESET EVENT ⚠
        </button>
      </div>
    </div>
  );
}