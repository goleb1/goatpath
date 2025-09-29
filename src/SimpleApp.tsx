import { useState, useEffect, useRef } from 'react';
import { SubwayProgressBar } from './components/Progress/SubwayProgressBar';

// All types defined in one place
interface Stop {
  id: string;
  name: string;
  address: string;
  position: number;
  distanceToNext?: string;
  status: 'pending' | 'active' | 'completed';
  arrivalTime?: string;
  departureTime?: string;
  duration?: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  password: string;
  adminPassword: string;
  status: 'scheduled' | 'active' | 'completed';
  stops: Stop[];
  createdAt: string;
  updatedAt: string;
  currentStopIndex: number;
  customMessage?: string;
}

// Sample data
const leTour2025: Event = {
  id: 'letour2025',
  title: 'Le Tour de South Hillbillies 2025',
  date: '2025-01-01',
  password: 'hillbillies2025',
  adminPassword: 'admin2025',
  status: 'scheduled',
  currentStopIndex: 0,
  stops: [
    {
      id: 'stop1',
      name: 'Grimm Central',
      address: '704 Crystal Drive',
      position: 0,
      distanceToNext: '1.9 miles',
      status: 'pending'
    },
    {
      id: 'stop2',
      name: 'McGee Metro',
      address: '64 Woodhaven Drive',
      position: 1,
      distanceToNext: '1.0 miles',
      status: 'pending'
    },
    {
      id: 'stop3',
      name: 'Brasacchio Boulevard',
      address: '217 Vernon Drive',
      position: 2,
      distanceToNext: '1.6 miles',
      status: 'pending'
    },
    {
      id: 'stop4',
      name: 'Styler Station',
      address: '631 Osage Road',
      position: 3,
      distanceToNext: '0.9 miles',
      status: 'pending'
    },
    {
      id: 'stop5',
      name: 'Holliday Heights',
      address: '1641 Williamsburg Road',
      position: 4,
      distanceToNext: '2.9 miles',
      status: 'pending'
    },
    {
      id: 'stop6',
      name: 'Albert Avenue',
      address: '2856 Broadway Avenue',
      position: 5,
      distanceToNext: '1.5 miles',
      status: 'pending'
    },
    {
      id: 'stop7',
      name: 'Baird Terminal',
      address: '1636 Bellaire Place',
      position: 6,
      distanceToNext: '1.2 miles',
      status: 'pending'
    },
    {
      id: 'stop8',
      name: 'Golebie Grand',
      address: '954 Norwich Avenue',
      position: 7,
      distanceToNext: '2.1 miles',
      status: 'pending'
    },
    {
      id: 'stop9',
      name: 'Baldasare Union',
      address: '325 Tampa Avenue',
      position: 8,
      status: 'pending'
    }
  ],
  createdAt: '2024-12-01T00:00:00Z',
  updatedAt: '2024-12-01T00:00:00Z'
};



// Enhanced Route Card Timer Component
function RouteCardTimer({ event, stop, index }: { event: Event; stop: Stop; index: number }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Determine if this card should show a timer
  const isActive = stop.status === 'active';
  const isRunningTo = index === event.currentStopIndex && 
                      stop.status === 'pending' && 
                      index > 0 && 
                      event.stops[index - 1].status === 'completed';
  
  let showTimer = false;
  let startTime: Date | null = null;
  
  if (isActive && stop.arrivalTime) {
    showTimer = true;
    startTime = new Date(stop.arrivalTime);
  } else if (isRunningTo) {
    const previousStop = event.stops[index - 1];
    if (previousStop && previousStop.status === 'completed' && previousStop.departureTime) {
      showTimer = true;
      startTime = new Date(previousStop.departureTime);
    }
  }
  
  useEffect(() => {
    if (!showTimer || !startTime) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      setElapsedSeconds(Math.max(0, diffSeconds));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [showTimer, startTime]);

  if (!showTimer) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  // Format time based on duration
  const timeDisplay = hours > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div style={{ 
      padding: '0.5rem 0.75rem',
      backgroundColor: '#231F20',
      border: '1px solid #B1CDFF',
      borderRadius: '4px',
      textAlign: 'center',
      minWidth: '80px'
    }}>
      <div style={{ 
        fontSize: '1.25rem', 
        fontWeight: 'bold', 
        color: '#EBE4C1',
        fontFamily: 'monospace',
        lineHeight: 1
      }}>
        {timeDisplay}
      </div>
    </div>
  );
}

// Storage keys
const STORAGE_KEYS = {
  EVENT: 'goatpath_event',
  LAST_UPDATE: 'goatpath_last_update'
};

// Main App Component
function SimpleApp() {
  const [event, setEvent] = useState<Event | null>(null);
  const routeListRef = useRef<HTMLDivElement>(null);

  // Load event from localStorage on mount
  useEffect(() => {
    const savedEvent = localStorage.getItem(STORAGE_KEYS.EVENT);
    if (savedEvent) {
      try {
        const parsedEvent = JSON.parse(savedEvent);
        // Validate that the parsed event has the required structure
        if (parsedEvent && parsedEvent.id && parsedEvent.stops && Array.isArray(parsedEvent.stops)) {
          setEvent(parsedEvent);
          return;
        }
      } catch (error) {
        console.error('Failed to parse saved event:', error);
      }
    }
    
    // Only initialize with default if no valid saved event exists
    const defaultEvent = { ...leTour2025 };
    localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(defaultEvent));
    setEvent(defaultEvent);
  }, []);

  // Poll for updates every 2 seconds
  useEffect(() => {
    const pollForUpdates = () => {
      const savedEvent = localStorage.getItem(STORAGE_KEYS.EVENT);

      if (savedEvent) {
        try {
          const parsedEvent = JSON.parse(savedEvent);
          const currentLastUpdate = event?.updatedAt;

          // Only update if the saved event is newer
          if (parsedEvent.updatedAt !== currentLastUpdate) {
            setEvent(parsedEvent);
          }
        } catch (error) {
          console.error('Failed to parse event during polling:', error);
        }
      }
    };

    const interval = setInterval(pollForUpdates, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [event?.updatedAt]);

  // Save event to localStorage whenever it changes (but don't save if we're still loading)
  useEffect(() => {
    if (event && event.id) {
      console.log('Saving event to localStorage:', event);
      localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(event));
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, event.updatedAt);
    }
  }, [event]);




  if (!event) return null;

  const progressPercentage = Math.round(
    (event.stops.filter(s => s.status === 'completed').length / event.stops.length) * 100
  );

  // Main Public View (no authentication required)
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#231F20', // Thunder background
      fontFamily: 'JetBrains Mono, monospace',
      color: '#EBE4C1', // Fall Green default text
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Fixed Header - Edge to Edge */}
      <div style={{ 
        backgroundColor: '#231F20', // Thunder background to match
        borderBottom: '3px solid #B1CDFF', // Melrose bottom border
        padding: '0.75rem 1rem', 
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* SHBAC Express Logo */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'left', 
            flex: 1,
            justifyContent: 'left'
          }}>
            <img 
              src="/src/assets/SHBACExpress.png" 
              alt="SHBAC Express" 
              style={{ 
                height: '70px', 
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
          
          {/* SHB Logo */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end',
            minWidth: 'fit-content'
          }}>
            <img 
              src="/src/assets/SHB_logo.png" 
              alt="SHB Logo" 
              style={{ 
                height: '70px', 
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      </div>

      {/* Marquee Sign - Fixed position just below header */}
      <div style={{
        position: 'fixed',
        top: '95px', // Position just below the sticky header
        left: '0',
        right: '0',
        width: '100vw',
        height: '45px',
        backgroundColor: '#324E80',
        borderTop: '2px solid #B1CDFF',
        borderBottom: '2px solid #B1CDFF',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 8 // Lower than header's zIndex: 10
      }}>
        <div
          key={event.customMessage || 'preset'} // Force re-render when message type changes
          style={{
            color: '#EBE4C1',
            fontSize: '1rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            animation: 'marqueeScroll 12s linear infinite'
          }}
        >
          ★ {(() => {
            // Check for custom message first
            if (event.customMessage) {
              return event.customMessage;
            }

            // Determine current message based on event state
            const currentStop = event.stops[event.currentStopIndex];
            if (!currentStop) return "WELCOME ABOARD SHBAC EXPRESS";

            if (currentStop.status === 'active') {
              // At a station
              const stationMessages: Record<string, string> = {
                "Grimm Central": "NOW AT GRIMM CENTRAL - FUEL UP AND STRETCH THOSE LEGS!",
                "McGee Metro": "WELCOME TO MCGEE METRO - QUICK STOP FOR REFRESHMENTS!",
                "Brasacchio Boulevard": "NOW ARRIVING BRASACCHIO BOULEVARD - ENJOY THE VALLEY VIEWS!",
                "Styler Station": "BRIEF STOP AT STYLER STATION - SHORTEST SEGMENT AHEAD BUT DON'T GET TOO COMFORTABLE!",
                "Holliday Heights": "WELCOME TO HOLLIDAY HEIGHTS - CROSSING INTO BROOKLINE TERRITORY AHEAD!",
                "Albert Avenue": "QUICK PIT STOP AT ALBERT AVENUE - HALFWAY HOME, HILLBILLIES!",
                "Baird Terminal": "NOW AT BAIRD TERMINAL - PREPARE FOR THE STEEPEST CLIMB OF THE DAY!",
                "Golebie Grand": "PENULTIMATE STOP: GOLEBIE GRAND! ONE MORE SEGMENT TO GO!",
                "Baldasare Union": "THANK YOU FOR RIDING SHBAC EXPRESS - PLEASE EXIT SAFELY!"
              };
              return stationMessages[currentStop.name] || `NOW AT ${currentStop.name.toUpperCase()}`;
            } else if (currentStop.status === 'pending' && event.currentStopIndex > 0) {
              // En route to current stop (previous stop was completed)
              const previousStop = event.stops[event.currentStopIndex - 1];
              if (previousStop && previousStop.status === 'completed') {
                const enRouteMessages: Record<string, string> = {
                  "McGee Metro": "NEXT STOP MCGEE METRO IN 2 MILES - WATCH YOUR STEP AND MIND THE HILLS!",
                  "Brasacchio Boulevard": "EXPRESS SERVICE TO BRASACCHIO BOULEVARD - 1.0 MILE OF SCENIC SOUTH HILLS AHEAD!",
                  "Styler Station": "EN ROUTE TO STYLER STATION - 1.6 MILES OF ROLLING TERRAIN, PLEASE HOLD ON!",
                  "Holliday Heights": "NOW DEPARTING FOR HOLLIDAY HEIGHTS - ONLY 0.9 MILES! PACE YOURSELVES, HILLBILLIES!",
                  "Albert Avenue": "CLIMBING 150 FEET OVER 2.9 MILES TO ALBERT AVENUE - STEADY AS SHE GOES!",
                  "Baird Terminal": "ALL ABOARD FOR BAIRD TERMINAL - 2.1 MILES TO GO!",
                  "Golebie Grand": "STEEPEST CLIMB AHEAD TO GOLEBIE GRAND - 1.2 MILES OF CHARACTER BUILDING!",
                  "Baldasare Union": "FINAL APPROACH TO BALDASARE UNION - 2.1 MILES TO VICTORY!"
                };
                return enRouteMessages[currentStop.name] || `EN ROUTE TO ${currentStop.name.toUpperCase()}`;
              }
            } else if (currentStop.status === 'completed' && event.currentStopIndex === event.stops.length - 1) {
              // Last stop completed
              return "THANK YOU FOR RIDING SHBAC EXPRESS - PLEASE EXIT SAFELY!";
            }

            // Default: Event not started or first stop pending
            return "WELCOME ABOARD SHBAC EXPRESS!";
          })()} ★
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes marqueeScroll {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
          `
        }} />
      </div>

      {/* Scrollable Route List with integrated progress bar */}
      <div
        ref={routeListRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          paddingTop: 'calc(45px + 1rem)', // Space for fixed marquee + normal padding
          display: 'flex' // Use flexbox to align sidebar with cards
        }}
      >
        {/* Subway Progress Bar - Full height tracker */}
        <div style={{
          alignSelf: 'stretch', // Stretch to full height
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <SubwayProgressBar 
            stops={event.stops}
            currentStopIndex={event.currentStopIndex}
            progressPercentage={progressPercentage}
          />
        </div>

        {/* Station Cards Container */}
        <div style={{
          flex: 1,
          paddingLeft: '0.5rem' // Tight spacing to save space
        }}>
        {event.stops.map((stop, index) => {
          const isCompleted = stop.status === 'completed';
          const isActive = stop.status === 'active';
          
          // Determine if we're running to this stop
          const isRunningTo = index === event.currentStopIndex && 
                             stop.status === 'pending' && 
                             index > 0 && 
                             event.stops[index - 1].status === 'completed';
          
          // A stop is "current" if it's active (physically there)
          const isCurrentStop = isActive;
          
          // Determine styling based on status
          const opacity = isCompleted ? 0.6 : 1;
          const backgroundColor = '#324E80'; // Chambray for all
          const borderColor = isCompleted ? '#7195CD80' : // Dimmed Danube for completed
                             isCurrentStop ? '#B1CDFF' : // Melrose for physically at stop
                             isRunningTo ? '#7195CD' : // Danube for running to
                             '#7195CD'; // Regular Danube for pending
          const borderWidth = isCurrentStop ? '3px' : 
                             isRunningTo ? '2px' : '2px';
          const boxShadow = isCurrentStop ? '0 0 25px rgba(177, 205, 255, 0.4)' : 
                           isRunningTo ? '0 0 15px rgba(113, 149, 205, 0.3)' : 'none';
          
          return (
            <div 
              key={stop.id}
              ref={(el) => {
                if ((isCurrentStop || isRunningTo) && el && routeListRef.current) {
                  // Auto-scroll to current/running-to stop with offset for header
                  setTimeout(() => {
                    const container = routeListRef.current;
                    if (container) {
                      const elementTop = el.offsetTop;
                      const offset = 20; // Small offset below header
                      container.scrollTo({
                        top: elementTop - offset,
                        behavior: 'smooth'
                      });
                    }
                  }, 100);
                }
              }}
              style={{ 
                position: 'relative', // For absolute positioned timer
                backgroundColor,
                border: `${borderWidth} solid ${borderColor}`,
                padding: '0.75rem',
                marginBottom: '0.75rem',
                marginRight: '0.5rem', // Reduce right margin
                opacity,
                boxShadow,
                transform: isCurrentStop ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.3s ease',
                width: '100%' // Full width of container
              }}
            >
              {/* Status or Timer in top right corner */}
              {stop.status === 'completed' ? (
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  fontSize: '0.8rem', 
                  fontWeight: 'bold',
                  color: '#7195CD' // Dimmed Danube for completed
                }}>
                  COMPLETED
                </div>
              ) : stop.status === 'pending' && !isRunningTo ? (
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  fontSize: '0.8rem', 
                  fontWeight: 'bold',
                  color: '#B1CDFF' // Melrose for upcoming
                }}>
                  UPCOMING
                </div>
              ) : (
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <RouteCardTimer event={event} stop={stop} index={index} />
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <div style={{ 
                  fontSize: (isCurrentStop || isRunningTo) ? '1.125rem' : '1rem',
                  fontWeight: 'bold', 
                  color: isCompleted ? '#7195CD' : // Dimmed blue for completed
                         (isCurrentStop || isRunningTo) ? '#EBE4C1' : // Bright white for current/running-to
                         '#A09376' // Muted brown for future stops
                }}>
                  {String(stop.position + 1).padStart(2, '0')}
                  {isCurrentStop && ' ← 🍺 AT STOP'}
                  {isRunningTo && ' ← 🏃‍♂️ RUNNING TO'}
                </div>
              </div>
              <h3 style={{ 
                fontSize: (isCurrentStop || isRunningTo) ? '1.25rem' : '1.125rem',
                fontWeight: 'bold', 
                color: isCompleted ? '#7195CD' : // Dimmed blue for completed
                       (isCurrentStop || isRunningTo) ? '#EBE4C1' : // Bright white for current/running-to
                       '#A09376', // Muted brown for future stops
                marginBottom: '0.375rem' 
              }}>
                {stop.name.toUpperCase()}
                {isCompleted && ' ✓'}
              </h3>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.5rem'
              }}>
                <button
                  onClick={() => {
                    const fullAddress = `${stop.address}, Pittsburgh, PA`;
                    const encodedAddress = encodeURIComponent(fullAddress);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                  }}
                  style={{
                    color: isCompleted ? '#A0937680' : '#A09376', // Dimmed for completed
                    backgroundColor: 'transparent',
                    border: 'none',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontFamily: 'inherit',
                    display: 'block',
                    flex: 1,
                    textAlign: 'left'
                  }}
                >
                  {stop.address}
                </button>
                {(() => {
                  // Determine what distance to show and how to label it
                  let distanceText = '';
                  let label = '';
                  
                  if (isRunningTo) {
                    // When running to a stop, show the distance from the previous stop
                    const previousStop = event.stops[index - 1];
                    if (previousStop && previousStop.distanceToNext) {
                      distanceText = previousStop.distanceToNext.replace('miles', 'mi');
                      label = 'Now: ';
                    }
                  } else if (stop.distanceToNext) {
                    // When at a stop, show the distance to the next stop
                    distanceText = stop.distanceToNext.replace('miles', 'mi');
                    label = 'Next: ';
                  }
                  
                  return distanceText ? (
                    <div style={{ 
                      color: isCompleted ? '#7195CD80' : '#7195CD', // Dimmed for completed
                      fontSize: '0.8rem',
                      textAlign: 'right',
                      marginLeft: '0.5rem'
                    }}>
                      {label}{distanceText}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          );
        })}
        </div> {/* Close station cards container */}
      </div>

      {/* Strava Link */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
        padding: '0 1rem' // Same horizontal padding as the main content
      }}>
        <a 
          href="https://www.strava.com/routes/3403462875498749806"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#FC4C02', // Strava orange
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            border: '2px solid #FC4C02',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            display: 'inline-block',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = '#FC4C02';
            (e.target as HTMLElement).style.color = '#231F20';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent';
            (e.target as HTMLElement).style.color = '#FC4C02';
          }}
        >
          Click here to view the full route on Strava
        </a>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        color: '#7195CD', // Danube for footer
        fontSize: '0.75rem',
        marginTop: '0.75rem'
      }}>
        Last updated: {new Date(event.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}

export default SimpleApp;