import { useState, useEffect } from 'react';
import { leTour2025 } from '../../data/letour2025';

// Types
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

// Storage keys
const STORAGE_KEYS = {
  EVENT: 'goatpath_event',
  LAST_UPDATE: 'goatpath_last_update'
};

// Timer Component
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

// Visual Timer Dots Component for Admin
function VisualTimerDots({ stop, isActive, isRunning }: { stop: Stop; isActive: boolean; isRunning: boolean }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [animationOffset, setAnimationOffset] = useState(0);
  const [pulseState, setPulseState] = useState(false);

  // Separate pulse effect that runs every 500ms
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseState(prev => !prev);
    }, 500);
    return () => clearInterval(pulseInterval);
  }, []);

  useEffect(() => {
    if (!isActive && !isRunning) {
      setElapsedSeconds(0);
      return;
    }

    let startTime: Date | null = null;

    if (isActive && stop.arrivalTime) {
      startTime = new Date(stop.arrivalTime);
    } else if (isRunning && stop.departureTime) {
      startTime = new Date(stop.departureTime);
    }

    if (!startTime) return;

    const updateTimer = () => {
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      setElapsedSeconds(Math.max(0, diffSeconds));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isActive, isRunning, stop.arrivalTime, stop.departureTime]);

  // Running animation effect
  useEffect(() => {
    if (!isRunning) {
      setAnimationOffset(0);
      return;
    }

    const animationInterval = setInterval(() => {
      setAnimationOffset(prev => (prev + 1) % 40); // 40 steps for smooth animation across 20 dots
    }, 100); // Update every 100ms for smooth movement

    return () => clearInterval(animationInterval);
  }, [isRunning]);

  const totalDots = 20;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const isOvertime = elapsedMinutes >= 20;

  const getDotColor = (index: number) => {
    if (isRunning) {
      const runningPosition = Math.floor(animationOffset / 2); // Convert to 0-19 range
      if (index === runningPosition) {
        return '#EBE4C1'; // White for running indicator
      }
      return '#444444'; // Dark for inactive during running
    }

    if (!isActive) {
      return '#444444'; // Dark when not active
    }

    if (isOvertime) {
      // Blink red when overtime
      const blinkPhase = Math.floor(elapsedSeconds / 1) % 2; // Blink every second
      return blinkPhase === 0 ? '#FF4444' : '#AA2222';
    }

    // Dots that have already gone out
    if (index < elapsedMinutes) {
      return '#444444'; // Dark for elapsed time
    }

    // Current minute dot - pulse the dot that's about to go out
    if (index === elapsedMinutes && elapsedMinutes < 20) {
      const baseColor = index < 10 ? '#00FF88' : index < 15 ? '#FFBB00' : '#FF4444';
      const dimColor = index < 10 ? '#004433' : index < 15 ? '#665500' : '#662222'; // Dimmed version instead of black


      return pulseState ? baseColor : dimColor;
    }

    // Remaining dots - normal colors
    if (index < 10) {
      return '#00FF88'; // Green for first 10 minutes
    } else if (index < 15) {
      return '#FFBB00'; // Yellow for minutes 10-15
    } else {
      return '#FF4444'; // Red for final 5 minutes
    }
  };

  const getDotOpacity = (index: number) => {
    if (isRunning) {
      const runningPosition = Math.floor(animationOffset / 2);
      return index === runningPosition ? 1 : 0.3;
    }
    return 1;
  };

  return (
    <div style={{
      display: 'flex',
      gap: '3px',
      padding: '8px 12px',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      backgroundColor: 'rgba(50, 78, 128, 0.9)', // Semi-transparent overlay
      borderRadius: '0'
    }}>
      {Array.from({ length: totalDots }, (_, index) => (
        <div
          key={index}
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: getDotColor(index),
            opacity: getDotOpacity(index),
            transition: isRunning ? 'opacity 0.1s ease' : 'background-color 0.3s ease',
            border: '1px solid #666666'
          }}
        />
      ))}
    </div>
  );
}

// Enhanced Route Card Timer Component (matches main page styling)
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

export function AdminApp() {
  const [event, setEvent] = useState<Event | null>(null);
  const [lastAction, setLastAction] = useState<{
    type: 'arrive' | 'depart';
    stopId: string;
    stopName: string;
    previousState: Event;
  } | null>(null);

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

  const updateStopStatus = (stopId: string, status: Stop['status']) => {
    if (!event) return;

    // Save the current state for undo functionality
    const stopToUpdate = event.stops.find(s => s.id === stopId);
    if (stopToUpdate) {
      setLastAction({
        type: status === 'active' ? 'arrive' : 'depart',
        stopId,
        stopName: stopToUpdate.name,
        previousState: { ...event, stops: event.stops.map(s => ({ ...s })) } // Deep copy
      });
    }

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

  const undoLastAction = () => {
    if (!lastAction) return;

    setEvent(lastAction.previousState);
    setLastAction(null); // Clear the undo after using it
  };

  const resetEvent = () => {
    if (window.confirm('Reset entire event? This will clear all progress.')) {
      setEvent(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('goatpath_admin_auth');
    window.location.href = '/admin'; // Redirect to admin login
  };

  if (!event) return null;

  const currentStop = event.stops[event.currentStopIndex];

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
      fontFamily: 'JetBrains Mono, monospace',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Fixed Header - Edge to Edge */}
      <div style={{
        backgroundColor: '#231F20', // Thunder background to match main page
        borderBottom: '3px solid #A09376', // Donkey Brown border for admin
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

          {/* Admin Portal Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            minWidth: 'fit-content',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{
              color: '#A09376', // Donkey Brown for admin
              fontSize: '0.875rem',
              fontWeight: 'bold',
              fontFamily: 'JetBrains Mono, monospace',
              width: '120px',
              textAlign: 'center'
            }}>
              ADMIN PORTAL
            </div>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#A09376',
                color: '#EBE4C1',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '2px',
                width: '120px'
              }}
            >
              LOGOUT
            </button>
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
        borderTop: '2px solid #A09376', // Admin color instead of Melrose
        borderBottom: '2px solid #A09376', // Admin color instead of Melrose
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

      {/* Content Container with proper spacing */}
      <div style={{
        flex: 1,
        padding: 'calc(45px + 1rem) 1rem 1rem 0.25rem', // Add space for marquee + normal padding
        overflow: 'auto'
      }}>
        {/* Station Cards - Previous, Current, Next */}
        <div style={{ marginBottom: '1.5rem' }}>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {(() => {
              const currentIndex = event.currentStopIndex;
              const stops = event.stops;
              const cards = [];

              // Previous Stop
              if (currentIndex > 0) {
                const prevStop = stops[currentIndex - 1];
                cards.push({
                  stop: prevStop,
                  label: 'PREVIOUS STOP',
                  type: 'previous'
                });
              }

              // Current Stop
              if (currentIndex < stops.length) {
                const currentStop = stops[currentIndex];
                cards.push({
                  stop: currentStop,
                  label: 'CURRENT STOP',
                  type: 'current'
                });
              }

              // Next Stop
              if (currentIndex < stops.length - 1) {
                const nextStop = stops[currentIndex + 1];
                cards.push({
                  stop: nextStop,
                  label: 'NEXT STOP',
                  type: 'next'
                });
              }

              return cards.map((card, index) => {
                const { stop, label, type } = card;
                const isCompleted = stop.status === 'completed';
                const isActive = stop.status === 'active';
                const isCurrentStop = type === 'current';

                // Determine if we're running to this stop
                const isRunningTo = type === 'current' &&
                                   stop.status === 'pending' &&
                                   currentIndex > 0 &&
                                   event.stops[currentIndex - 1].status === 'completed';

                // Determine styling based on status
                const opacity = isCompleted ? 0.6 : 1;
                const backgroundColor = '#324E80'; // Chambray for all
                const borderColor = isCompleted ? '#7195CD80' : // Dimmed Danube for completed
                                   isActive ? '#B1CDFF' : // Melrose for physically at stop
                                   isRunningTo ? '#7195CD' : // Danube for running to
                                   '#7195CD'; // Regular Danube for pending
                const borderWidth = isActive ? '3px' :
                                   isRunningTo ? '2px' : '2px';
                const boxShadow = isActive ? '0 0 25px rgba(177, 205, 255, 0.4)' :
                                 isRunningTo ? '0 0 15px rgba(113, 149, 205, 0.3)' : 'none';

                return (
                  <div key={stop.id} style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: '0.25rem',
                    marginBottom: index < cards.length - 1 ? '1rem' : '0'
                  }}>
                    {/* Label on the left */}
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#A09376',
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                      transform: 'rotate(180deg)',
                      minWidth: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {label}
                    </div>

                    {/* Station card */}
                    <div style={{
                      position: 'relative',
                      backgroundColor,
                      border: `${borderWidth} solid ${borderColor}`,
                      padding: isCurrentStop ? '2.25rem 0.75rem 0.75rem 0.75rem' : '0.75rem', // Extra top padding for current stop
                      opacity,
                      boxShadow,
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.3s ease',
                      flex: 1
                    }}>

                    {/* Visual Timer Dots for Current Stop - at top edge */}
                    {isCurrentStop && (
                      <VisualTimerDots
                        stop={stop}
                        isActive={isActive}
                        isRunning={isRunningTo}
                      />
                    )}

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
                        top: '2.5rem',
                        right: '0.75rem',
                        display: 'flex',
                        justifyContent: 'flex-end'
                      }}>
                        <RouteCardTimer event={event} stop={stop} index={stop.position} />
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        fontSize: isActive || isRunningTo ? '1.125rem' : '1rem',
                        fontWeight: 'bold',
                        color: isCompleted ? '#7195CD' : // Dimmed blue for completed
                               (isActive || isRunningTo) ? '#EBE4C1' : // Bright white for current/running-to
                               '#A09376' // Muted brown for future stops
                      }}>
                        {String(stop.position + 1).padStart(2, '0')}
                        {isActive && ' ← 🍺 AT STOP'}
                        {isRunningTo && ' ← 🏃‍♂️ RUNNING TO'}
                      </div>
                    </div>

                    <h3 style={{
                      fontSize: isActive || isRunningTo ? '1.25rem' : '1.125rem',
                      fontWeight: 'bold',
                      color: isCompleted ? '#7195CD' : // Dimmed blue for completed
                             (isActive || isRunningTo) ? '#EBE4C1' : // Bright white for current/running-to
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
                        let distanceLabel = '';

                        if (isRunningTo) {
                          // When running to a stop, show the distance from the previous stop
                          const previousStop = event.stops[stop.position - 1];
                          if (previousStop && previousStop.distanceToNext) {
                            distanceText = previousStop.distanceToNext.replace('miles', 'mi');
                            distanceLabel = 'Now: ';
                          }
                        } else if (stop.distanceToNext) {
                          // When at a stop, show the distance to the next stop
                          distanceText = stop.distanceToNext.replace('miles', 'mi');
                          distanceLabel = 'Next: ';
                        }

                        return distanceText ? (
                          <div style={{
                            color: isCompleted ? '#7195CD80' : '#7195CD', // Dimmed for completed
                            fontSize: '0.8rem',
                            textAlign: 'right',
                            marginLeft: '0.5rem'
                          }}>
                            {distanceLabel}{distanceText}
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Admin Controls for Current Stop */}
                    {isCurrentStop && (
                      <div style={{
                        marginTop: '1rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.75rem'
                      }}>
                        <button
                          onClick={() => updateStopStatus(stop.id, 'active')}
                          disabled={!canArrive}
                          style={{
                            padding: '0.75rem 1rem',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: canArrive ? 'pointer' : 'not-allowed',
                            backgroundColor: canArrive ? '#B1CDFF' : 'rgba(177, 205, 255, 0.3)',
                            color: canArrive ? '#231F20' : 'rgba(35, 31, 32, 0.5)'
                          }}
                        >
                          ✓ ARRIVED
                        </button>

                        <button
                          onClick={() => updateStopStatus(stop.id, 'completed')}
                          disabled={!canDepart}
                          style={{
                            padding: '0.75rem 1rem',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            border: 'none',
                            cursor: canDepart ? 'pointer' : 'not-allowed',
                            backgroundColor: canDepart ? '#B1CDFF' : 'rgba(177, 205, 255, 0.3)',
                            color: canDepart ? '#231F20' : 'rgba(35, 31, 32, 0.5)'
                          }}
                        >
                          → DEPARTED
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Admin Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '0.25rem',
          marginBottom: '1rem'
        }}>
          {/* Empty space for label alignment */}
          <div style={{
            minWidth: '20px'
          }}>
          </div>

          {/* Control buttons aligned with blue boxes */}
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: lastAction ? '1fr 1fr' : '1fr',
            gap: '0.75rem'
          }}>
            {/* Undo button - only show if there's something to undo */}
            {lastAction && (
              <button
                onClick={undoLastAction}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#7195CD', // Danube for undo
                  color: '#EBE4C1', // Fall Green text
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ↶ UNDO {lastAction.type.toUpperCase()} AT {lastAction.stopName.toUpperCase()}
              </button>
            )}

            {/* Reset button */}
            <button
              onClick={resetEvent}
              style={{
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
        </div>
      </div>
    </div>
  );
}