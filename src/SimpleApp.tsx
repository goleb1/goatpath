import React, { useState, useEffect, useRef } from 'react';

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

// Enhanced Timer Component with seconds
function Timer({ stop, isActive }: { stop: Stop; isActive: boolean }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isActive || !stop.arrivalTime) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(stop.arrivalTime);
    
    const updateTimer = () => {
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      setElapsedSeconds(Math.max(0, diffSeconds));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, stop.arrivalTime]);

  if (!isActive || !stop.arrivalTime) {
    return null;
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const getTimerColor = () => {
    if (minutes >= 20) return '#A09376'; // Donkey Brown for long stays
    if (minutes >= 10) return '#7195CD'; // Danube for medium stays
    return '#B1CDFF'; // Melrose for fresh arrivals
  };

  return (
    <div style={{ 
      fontSize: '1.125rem', 
      fontWeight: 'bold', 
      color: getTimerColor() 
    }}>
      ⏱ {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}

// Current Activity Status Component
function CurrentActivityStatus({ event }: { event: Event }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Determine current activity using currentStopIndex and stop statuses
  let activity: 'AT_STOP' | 'RUNNING' | 'NOT_STARTED' | 'FINISHED';
  let locationName = '';
  let startTime: Date | null = null;

  // Check if event is finished (all stops completed)
  const allCompleted = event.stops.every(stop => stop.status === 'completed');
  if (allCompleted) {
    activity = 'FINISHED';
  } else {
    // Get the current stop based on currentStopIndex
    const currentStop = event.stops[event.currentStopIndex];
    
    if (currentStop && currentStop.status === 'active' && currentStop.arrivalTime) {
      // We're currently at a stop
      activity = 'AT_STOP';
      locationName = currentStop.name;
      startTime = new Date(currentStop.arrivalTime);
    } else if (currentStop && currentStop.status === 'pending') {
      // Current stop is pending - check if we departed from previous stop
      const previousStop = event.stops[event.currentStopIndex - 1];
      if (previousStop && previousStop.status === 'completed' && previousStop.departureTime) {
        // We departed from previous stop, so we're running to current stop
        activity = 'RUNNING';
        locationName = currentStop.name;
        startTime = new Date(previousStop.departureTime);
      } else {
        // No previous completed stop - event not started yet
        activity = 'NOT_STARTED';
      }
    } else {
      // Check if any stops have been started
      const hasStarted = event.stops.some(stop => stop.status !== 'pending');
      if (hasStarted) {
        // Something went wrong with state - try to recover
        const activeStop = event.stops.find(stop => stop.status === 'active');
        if (activeStop && activeStop.arrivalTime) {
          activity = 'AT_STOP';
          locationName = activeStop.name;
          startTime = new Date(activeStop.arrivalTime);
        } else {
          activity = 'NOT_STARTED';
        }
      } else {
        activity = 'NOT_STARTED';
      }
    }
  }

  useEffect(() => {
    if (!startTime) {
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
  }, [startTime]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const getStatusColor = () => {
    switch (activity) {
      case 'AT_STOP': return '#B1CDFF'; // Melrose
      case 'RUNNING': return '#7195CD'; // Danube
      case 'NOT_STARTED': return '#A09376'; // Donkey Brown
      case 'FINISHED': return '#EBE4C1'; // Fall Green
    }
  };

  const getStatusText = () => {
    switch (activity) {
      case 'AT_STOP': return `🍺 AT STOP: ${locationName.toUpperCase()}`;
      case 'RUNNING': return `🏃 RUNNING TO: ${locationName.toUpperCase()}`;
      case 'NOT_STARTED': return '⏸ EVENT NOT STARTED';
      case 'FINISHED': return '🎉 EVENT COMPLETE!';
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#324E80', // Chambray
      border: `3px solid ${getStatusColor()}`,
      padding: '1rem', 
      marginBottom: '1rem',
      textAlign: 'center',
      boxShadow: `0 0 25px ${getStatusColor()}33`
    }}>
      <div style={{ 
        fontSize: '1.375rem', 
        fontWeight: 'bold', 
        color: getStatusColor(),
        marginBottom: '0.375rem'
      }}>
        {getStatusText()}
      </div>
      
      {startTime && (
        <div style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#EBE4C1', // Fall Green
          fontFamily: 'monospace'
        }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      )}
      
      {activity === 'AT_STOP' && (
        <div style={{ 
          color: '#A09376', // Donkey Brown
          fontSize: '0.875rem',
          marginTop: '0.5rem'
        }}>
          Time at this stop
        </div>
      )}
      
      {activity === 'RUNNING' && (
        <div style={{ 
          color: '#A09376', // Donkey Brown
          fontSize: '0.875rem',
          marginTop: '0.5rem'
        }}>
          Time since leaving last stop
        </div>
      )}
    </div>
  );
}

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
      position: 'absolute',
      top: '0.5rem',
      right: '0.5rem',
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

  // Poll for updates every 2 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated, event?.updatedAt]);

  // Save event to localStorage whenever it changes (but don't save if we're still loading)
  useEffect(() => {
    if (event && event.id) {
      console.log('Saving event to localStorage:', event);
      localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(event));
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, event.updatedAt);
    }
  }, [event]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === leTour2025.password) {
      // Don't overwrite existing event data! Just authenticate
      if (!event) {
        setEvent(leTour2025);
      }
      setIsAuthenticated(true);
      setIsAdmin(false);
      setError('');
    } else if (password === leTour2025.adminPassword) {
      // Don't overwrite existing event data! Just authenticate
      if (!event) {
        setEvent(leTour2025);
      }
      setIsAuthenticated(true);
      setIsAdmin(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  const updateStopStatus = (stopId: string, status: Stop['status']) => {
    if (!event) return;
    
    const timestamp = new Date().toISOString();
    const updatedStops = event.stops.map(stop => {
      if (stop.id === stopId) {
        const updatedStop = { ...stop, status };
        if (status === 'active') {
          updatedStop.arrivalTime = timestamp;
        } else if (status === 'completed') {
          updatedStop.departureTime = timestamp;
          if (updatedStop.arrivalTime) {
            const arrival = new Date(updatedStop.arrivalTime);
            const departure = new Date(updatedStop.departureTime);
            updatedStop.duration = Math.floor((departure.getTime() - arrival.getTime()) / 1000 / 60);
          }
        }
        return updatedStop;
      }
      return stop;
    });
    
    // Update currentStopIndex when departing from a stop (advance to next)
    let newCurrentStopIndex = event.currentStopIndex;
    if (status === 'completed') {
      // Find the position of the stop we're departing from
      const departingStop = event.stops.find(s => s.id === stopId);
      if (departingStop && departingStop.position < event.stops.length - 1) {
        newCurrentStopIndex = departingStop.position + 1;
      }
    }
    
    setEvent({ 
      ...event, 
      stops: updatedStops, 
      currentStopIndex: newCurrentStopIndex,
      updatedAt: timestamp 
    });
  };


  const resetEvent = () => {
    if (window.confirm('Reset entire event? This will clear all progress.')) {
      setEvent(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setPassword('');
      setError('');
    }
  };

  // Password Screen
  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#231F20', // Thunder background
        padding: '1rem',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        <div style={{ width: '100%', maxWidth: '28rem' }}>
          <div style={{ 
            backgroundColor: '#324E80', // Chambray card background
            border: '2px solid #B1CDFF', // Melrose border
            padding: '2rem', 
            borderRadius: '0.5rem' 
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#EBE4C1', // Fall Green for title
                marginBottom: '0.5rem' 
              }}>
                LE TOUR DE SOUTH HILLBILLIES
              </h1>
              <div style={{ color: '#A09376', fontSize: '0.875rem' }}> {/* Donkey Brown */}
                ═══════════════════════════════
              </div>
              <p style={{ color: '#B1CDFF', marginTop: '1rem' }}> {/* Melrose */}
                ENTER PASSWORD TO CONTINUE
              </p>
            </div>
            
            <form onSubmit={handleAuth}>
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#231F20', // Thunder background
                    border: '2px solid #7195CD', // Danube border
                    color: '#EBE4C1', // Fall Green text
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '1rem'
                  }}
                  placeholder="PASSWORD"
                  autoFocus
                />
              </div>
              
              {error && (
                <div style={{ 
                  color: '#A09376', // Donkey Brown for errors
                  textAlign: 'center', 
                  marginBottom: '1.5rem' 
                }}>
                  {error.toUpperCase()}
                </div>
              )}
              
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#B1CDFF', // Melrose button
                  color: '#231F20', // Thunder text
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ENTER
              </button>
            </form>
            
            <div style={{ 
              marginTop: '2rem', 
              textAlign: 'center', 
              fontSize: '0.75rem', 
              color: '#7195CD' // Danube for footer text
            }}>
              AUTHORIZED PERSONNEL ONLY
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const currentStop = event.stops[event.currentStopIndex];
  const progressPercentage = Math.round(
    (event.stops.filter(s => s.status === 'completed').length / event.stops.length) * 100
  );

  // Admin Panel
  if (isAdmin) {
    // Determine what actions are available based on current state
    let actionableStop = null;
    let canArrive = false;
    let canDepart = false;
    
    if (currentStop && currentStop.status === 'pending') {
      // Haven't started current stop yet - can arrive
      actionableStop = currentStop;
      canArrive = true;
      canDepart = false;
    } else if (currentStop && currentStop.status === 'active') {
      // Currently at current stop - can depart
      actionableStop = currentStop;
      canArrive = false;
      canDepart = true;
    } else if (currentStop && currentStop.status === 'completed') {
      // Already departed from current stop - can arrive at next stop
      const nextStop = event.stops[event.currentStopIndex + 1];
      if (nextStop && nextStop.status === 'pending') {
        actionableStop = nextStop;
        canArrive = true;
        canDepart = false;
      }
    }

    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#231F20', // Thunder background
        padding: '1rem',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: '#324E80', // Chambray header
          border: '2px solid #A09376', // Donkey Brown border for admin
          padding: '1rem', 
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#EBE4C1', // Fall Green title
            marginBottom: '0.5rem' 
          }}>
            ADMIN CONTROL PANEL
          </h1>
          <div style={{ color: '#A09376', fontSize: '0.875rem' }}> {/* Donkey Brown */}
            ═══════════════════════════════
          </div>
          <div style={{ color: '#B1CDFF', marginTop: '0.5rem' }}> {/* Melrose */}
            {event.title.toUpperCase()}
          </div>
        </div>

        {/* Marquee Sign */}
        <div style={{
          position: 'absolute',
          left: '0',
          right: '0',
          width: '100vw',
          height: '45px',
          backgroundColor: '#324E80',
          borderTop: '2px solid #A09376',
          borderBottom: '2px solid #A09376',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          zIndex: 5
        }}>
          <div
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
              // Same logic as public view but with admin indicator
              const currentStop = event.stops[event.currentStopIndex];
              if (!currentStop) return "ADMIN CONTROL - WELCOME ABOARD SHBAC EXPRESS";

              if (currentStop.status === 'active') {
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
              return "ADMIN CONTROL - WELCOME ABOARD SHBAC EXPRESS";
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

        {/* Spacer for marquee */}
        <div style={{ height: '45px', marginBottom: '1rem' }}></div>

        {/* Current Activity Status */}
        <CurrentActivityStatus event={event} />

        {/* Current Stop Control */}
        {actionableStop && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'bold', 
              color: '#EBE4C1', // Fall Green
              marginBottom: '1rem' 
            }}>
              {canArrive ? 'NEXT STOP' : 'CURRENT STOP'}: {actionableStop.name.toUpperCase()}
            </h2>
            
            <div style={{ 
              backgroundColor: '#324E80', // Chambray
              border: '2px solid #B1CDFF', // Melrose border
              padding: '1rem',
              marginBottom: '1rem',
              boxShadow: '0 0 20px rgba(177, 205, 255, 0.2)' // Melrose glow
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#EBE4C1' }}> {/* Fall Green */}
                  {String(actionableStop.position + 1).padStart(2, '0')}
                </div>
                <Timer stop={actionableStop} isActive={canDepart} />
              </div>
              
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: '#EBE4C1', // Fall Green
                marginBottom: '0.5rem' 
              }}>
                {actionableStop.name.toUpperCase()}
              </h3>
              
              <button
                onClick={() => {
                  const fullAddress = `${actionableStop.address}, Pittsburgh, PA`;
                  const encodedAddress = encodeURIComponent(fullAddress);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                }}
                style={{
                  color: '#A09376', // Donkey Brown for addresses
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
                {actionableStop.address}
              </button>
              
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: 'bold',
                color: actionableStop.status === 'active' ? '#B1CDFF' : '#7195CD' // Melrose for active, Danube for pending
              }}>
                {actionableStop.status === 'pending' ? 'NOT STARTED' : 
                 actionableStop.status === 'active' ? 'IN PROGRESS' : 'COMPLETED'}
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
                onClick={() => updateStopStatus(actionableStop.id, 'active')}
                disabled={!canArrive}
                style={{
                  padding: '1rem 1.5rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  border: 'none',
                  cursor: canArrive ? 'pointer' : 'not-allowed',
                  backgroundColor: canArrive ? '#B1CDFF' : 'rgba(177, 205, 255, 0.3)', // Melrose
                  color: canArrive ? '#231F20' : 'rgba(35, 31, 32, 0.5)' // Thunder text
                }}
              >
                ✓ ARRIVED
              </button>
              
              <button
                onClick={() => {
                  updateStopStatus(actionableStop.id, 'completed');
                }}
                disabled={!canDepart}
                style={{
                  padding: '1rem 1.5rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  border: 'none',
                  cursor: canDepart ? 'pointer' : 'not-allowed',
                  backgroundColor: canDepart ? '#7195CD' : 'rgba(113, 149, 205, 0.3)', // Danube
                  color: canDepart ? '#231F20' : 'rgba(35, 31, 32, 0.5)' // Thunder text
                }}
              >
                → DEPARTED
              </button>
            </div>
          </div>
        )}

        {/* Emergency Reset */}
        <button
          onClick={resetEvent}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#A09376', // Donkey Brown for reset
            color: '#EBE4C1', // Fall Green text
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ⚠ RESET EVENT ⚠
        </button>
      </div>
    );
  }

  // Participant View
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
          {/* Logo */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            minWidth: 'fit-content',
            padding: '0.75rem',
            marginLeft: '-0.75rem' // Offset the padding to align with edge
          }}>
            <img 
              src="/src/assets/SHB_logo.png" 
              alt="South Hillbillies Logo" 
              style={{ 
                height: '48px', 
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
          
          <div style={{ flex: 1, marginLeft: '1rem' }}>
            <h1 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'bold', 
              color: '#EBE4C1', // Fall Green
              margin: 0,
              lineHeight: 1.2
            }}>
              {event.title.toUpperCase()}
            </h1>
            <div style={{ 
              color: '#B1CDFF', 
              fontSize: '0.75rem',
              marginTop: '0.125rem'
            }}>
              LIVE TRACKING
            </div>
          </div>
          
          {/* Beer Mug Progress */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            minWidth: 'fit-content'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#A09376',
                lineHeight: 1
              }}>
                PROGRESS
              </div>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: 'bold', 
                color: '#B1CDFF',
                lineHeight: 1
              }}>
                {progressPercentage}%
              </div>
            </div>
            
            {/* Beer Mug */}
            <div style={{ 
              position: 'relative',
              width: '32px',
              height: '48px',
              marginRight: '0.5rem'
            }}>
              {/* Mug outline */}
              <div style={{
                position: 'absolute',
                width: '26px',
                height: '42px',
                border: '2px solid #B1CDFF',
                borderRadius: '0 0 10px 10px',
                backgroundColor: 'transparent'
              }}>
                {/* Beer fill (empties as progress increases) */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: `${100 - progressPercentage}%`,
                  backgroundColor: '#FFBF00', // Beer color
                  borderRadius: progressPercentage > 80 ? '0' : '0 0 8px 8px',
                  transition: 'height 0.5s ease'
                }}>
                  {/* Foam layer */}
                  {progressPercentage < 100 && (
                    <div style={{
                      position: 'absolute',
                      top: '-3px',
                      left: 0,
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#FFF8DC',
                      borderRadius: '3px'
                    }}></div>
                  )}
                </div>
              </div>
              
              {/* Mug handle */}
              <div style={{
                position: 'absolute',
                right: '-8px',
                top: '8px',
                width: '10px',
                height: '16px',
                border: '2px solid #B1CDFF',
                borderLeft: 'none',
                borderRadius: '0 6px 6px 0'
              }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee Sign - Fixed position just below header */}
      <div style={{
        position: 'fixed',
        top: '97px', // Position just below the sticky header
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

      {/* Scrollable Route List */}
      <div
        ref={routeListRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          paddingTop: 'calc(45px + 1rem)' // Space for fixed marquee + normal padding
        }}
      >
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
                opacity,
                boxShadow,
                transform: isCurrentStop ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Timer in top right corner */}
              <RouteCardTimer event={event} stop={stop} index={index} />
              
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
                  marginBottom: '0.5rem',
                  display: 'block'
                }}
              >
                {stop.address}
              </button>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '0.25rem'
              }}>
                <div style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold',
                  color: isCompleted ? '#7195CD' : // Dimmed Danube for completed
                         isActive ? '#B1CDFF' : '#B1CDFF' // Melrose for active and pending (light yellow)
                }}>
                  {stop.status === 'pending' ? 'NOT STARTED' : 
                   stop.status === 'active' ? 'IN PROGRESS' : 'COMPLETED'}
                </div>
                {stop.distanceToNext && (
                  <div style={{ 
                    color: isCompleted ? '#7195CD80' : '#7195CD', // Dimmed for completed
                    fontSize: '0.8rem' 
                  }}>
                    Next: {stop.distanceToNext}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        color: '#7195CD', // Danube for footer
        fontSize: '0.75rem',
        marginTop: '2rem'
      }}>
        Last updated: {new Date(event.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}

export default SimpleApp;