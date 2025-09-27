import { useEvent } from '../../context/EventContext';
import { MarqueeSign } from '../MarqueeSign/MarqueeSign';

export function SimpleEventDisplay() {
  const { state } = useEvent();
  
  if (!state.event) return null;

  const currentStop = state.event.stops[state.event.currentStopIndex];
  const progressPercentage = Math.round(
    (state.event.stops.filter(s => s.status === 'completed').length / state.event.stops.length) * 100
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a', 
      padding: '1rem',
      fontFamily: 'JetBrains Mono, monospace',
      color: '#00ff00'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        border: '2px solid #00ff00', 
        padding: '1rem', 
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          color: '#00ff00', 
          marginBottom: '0.5rem' 
        }}>
          {state.event.title.toUpperCase()}
        </h1>
        <div style={{ color: '#ffbf00', fontSize: '0.875rem' }}>
          ═══════════════════════════════
        </div>
        <div style={{ color: '#00ff00', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          REAL-TIME EVENT TRACKING
        </div>
        
        {/* Progress Bar */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '0.75rem', 
            marginBottom: '0.25rem' 
          }}>
            <span>PROGRESS</span>
            <span>{progressPercentage}%</span>
          </div>
          <div style={{ 
            width: '100%', 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #00ff00', 
            height: '0.5rem' 
          }}>
            <div style={{ 
              height: '100%', 
              backgroundColor: '#00ff00', 
              width: `${progressPercentage}%`,
              transition: 'width 0.5s ease'
            }}></div>
          </div>
        </div>
      </div>

      {/* Marquee Sign */}
      <MarqueeSign />

      {/* Current Stop */}
      {currentStop && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 'bold', 
            color: '#ffbf00', 
            marginBottom: '1rem' 
          }}>
            CURRENT LOCATION
          </h2>
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            border: '2px solid #ffbf00', 
            padding: '1rem',
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
            <button
              onClick={() => {
                const fullAddress = `${currentStop.address}, Pittsburgh, PA`;
                const encodedAddress = encodeURIComponent(fullAddress);
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
              }}
              style={{
                color: '#ffbf00',
                backgroundColor: 'transparent',
                border: 'none',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontFamily: 'inherit'
              }}
            >
              {currentStop.address}
            </button>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '0.75rem'
            }}>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: 'bold',
                color: currentStop.status === 'active' ? '#00ff00' : '#ffbf00'
              }}>
                {currentStop.status === 'pending' ? 'NOT STARTED' : 
                 currentStop.status === 'active' ? 'IN PROGRESS' : 'COMPLETED'}
              </div>
              {currentStop.distanceToNext && (
                <div style={{ 
                  color: 'rgba(0, 255, 0, 0.6)', 
                  fontSize: '0.875rem' 
                }}>
                  Next: {currentStop.distanceToNext}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Stops */}
      <div>
        <h2 style={{ 
          fontSize: '1.125rem', 
          fontWeight: 'bold', 
          color: '#00ff00', 
          marginBottom: '1rem' 
        }}>
          🗺 COMPLETE ROUTE
        </h2>
        {state.event.stops.map((stop, index) => (
          <div 
            key={stop.id}
            style={{ 
              backgroundColor: '#1a1a1a', 
              border: `2px solid ${index === state.event!.currentStopIndex ? '#ffbf00' : '#00ff00'}`, 
              padding: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}>
              <div style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'bold', 
                color: '#00ff00' 
              }}>
                {String(stop.position + 1).padStart(2, '0')}
              </div>
            </div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: '#00ff00', 
              marginBottom: '0.5rem' 
            }}>
              {stop.name.toUpperCase()}
            </h3>
            <button
              onClick={() => {
                const fullAddress = `${stop.address}, Pittsburgh, PA`;
                const encodedAddress = encodeURIComponent(fullAddress);
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
              }}
              style={{
                color: '#ffbf00',
                backgroundColor: 'transparent',
                border: 'none',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                marginBottom: '0.75rem',
                display: 'block'
              }}
            >
              {stop.address}
            </button>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: 'bold',
                color: stop.status === 'completed' ? 'rgba(0, 255, 0, 0.6)' :
                       stop.status === 'active' ? '#00ff00' : '#ffbf00'
              }}>
                {stop.status === 'pending' ? 'NOT STARTED' : 
                 stop.status === 'active' ? 'IN PROGRESS' : 'COMPLETED'}
              </div>
              {stop.distanceToNext && (
                <div style={{ 
                  color: 'rgba(0, 255, 0, 0.6)', 
                  fontSize: '0.875rem' 
                }}>
                  Next: {stop.distanceToNext}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        color: 'rgba(0, 255, 0, 0.6)',
        fontSize: '0.75rem',
        marginTop: '2rem'
      }}>
        Last updated: {new Date(state.event.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}