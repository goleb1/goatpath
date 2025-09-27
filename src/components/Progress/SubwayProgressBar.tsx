import { useState, useEffect } from 'react';

interface Stop {
  id: string;
  name: string;
  position: number;
  status: 'pending' | 'active' | 'completed';
  arrivalTime?: string;
}

interface SubwayProgressBarProps {
  stops: Stop[];
  currentStopIndex: number;
  progressPercentage: number;
}

export function SubwayProgressBar({ stops, currentStopIndex, progressPercentage }: SubwayProgressBarProps) {
  const totalStops = stops.length;
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every second for real-time drain
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate real-time beer drain during active stops
  const calculateRealTimeBeerLevel = () => {
    const currentStop = stops[currentStopIndex];
    
    // If we're at an active stop with arrival time, calculate drain
    if (currentStop && currentStop.status === 'active' && currentStop.arrivalTime) {
      const arrivalTime = new Date(currentStop.arrivalTime);
      const timeAtStop = (currentTime.getTime() - arrivalTime.getTime()) / 1000 / 60; // minutes
      
      // Start from the current progress percentage (where the beer was when we arrived)
      const baseProgress = progressPercentage;
      
      // Calculate how much to drain (one stop's worth of progress)
      const stopProgressRange = 100 / (totalStops - 1); // Each stop represents this much progress
      
      // Drain over 20 minutes (0 to 1 over 20 minutes)
      const drainProgress = Math.min(timeAtStop / 20, 1);
      
      // Calculate the new progress (base + drain)
      const realTimeProgress = baseProgress + (stopProgressRange * drainProgress);
      
      return 100 - realTimeProgress; // Invert for beer level
    }
    
    // Default behavior for non-active stops
    return 100 - progressPercentage;
  };
  
  // Calculate the beer fill level with real-time drain
  const beerFillPercentage = calculateRealTimeBeerLevel();
  
  return (
    <div style={{
      position: 'relative',
      width: '30px', // Half the previous size
      height: 'calc(100% - 12px)', // Reduce height to match card bottom margin
      backgroundColor: '#231F20', // Thunder background
      border: '2px solid #B1CDFF', // Melrose border
      borderRadius: '6px',
      overflow: 'hidden',
      marginRight: '0.5rem', // Tight spacing to save space
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Beer fill background */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: `${beerFillPercentage}%`,
        backgroundColor: '#FFBF00', // Beer color
        transition: 'height 0.5s ease',
        borderRadius: beerFillPercentage < 20 ? '0' : '0 3px 3px 0'
      }}>
        {/* Foam layer */}
        {beerFillPercentage > 0 && (
          <div style={{
            position: 'absolute',
            top: '-3px',
            left: 0,
            width: '100%',
            height: '4px',
            backgroundColor: '#FFF8DC',
            borderRadius: '0 0px 0px 0'
          }}></div>
        )}
      </div>
      
      {/* Station dots and connections */}
      <div style={{
        position: 'relative',
        height: '100%', // Full height of the container
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '0' // No padding
      }}>
        {stops.map((stop, index) => {
          const isCompleted = stop.status === 'completed';
          const isActive = stop.status === 'active';
          const isRunningTo = index === currentStopIndex && stop.status === 'pending' && index > 0 && stops[index - 1].status === 'completed';
          
          // Check if we're over the 20-minute limit at an active stop
          const isOverTime = isActive && stop.arrivalTime && 
            ((currentTime.getTime() - new Date(stop.arrivalTime).getTime()) / 1000 / 60) > 20;
          
          // Determine dot styling
          const dotColor = isCompleted ? '#7195CD' : // Dimmed Danube for completed
                          isActive && isOverTime ? '#FF4444' : // Bright red for over-time active stops
                          isActive ? '#FFFFFF' : // White for active (high contrast)
                          isRunningTo ? '#FFFFFF' : // White for running to (high contrast)
                          '#A09376'; // Donkey Brown for pending
          
          const dotSize = isActive || isRunningTo ? '22px' : '16px'; // Even larger for current stops
          const dotBorder = isActive && isOverTime ? '3px solid #FF0000' : // Red border for over-time active stops
                           isActive ? '3px solid #231F20' : // Black border for active (high contrast)
                           isRunningTo ? '3px solid #231F20' : // Black border for running to (high contrast)
                           '2px solid #231F20'; // Dark border for others
          
          return (
            <div key={stop.id} style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minHeight: '60px' // Back to simple height
            }}>
              {/* Connection line to next stop */}
              {index < totalStops - 1 && (
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '3px',
                  height: '100%',
                  backgroundColor: isCompleted ? '#7195CD' : '#A09376',
                  zIndex: 1,
                  transform: 'translateX(-50%)'
                }}></div>
              )}
              
              {/* Station dot */}
              <div style={{
                position: 'relative',
                width: dotSize,
                height: dotSize,
                backgroundColor: dotColor,
                borderRadius: '50%',
                border: dotBorder,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive && isOverTime ? '0 0 20px rgba(255, 68, 68, 0.9), 0 0 40px rgba(255, 68, 68, 0.5)' : // Bright red glow for over-time active
                           isActive ? '0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.5)' : // Bright white glow for active
                           isRunningTo ? '0 0 12px rgba(255, 255, 255, 0.8), 0 0 25px rgba(255, 255, 255, 0.4)' : // White glow for running to
                           'none', // No glow for others
                transition: 'all 0.3s ease'
              }}>
                {/* Current stop indicator */}
                {isActive && (
                  <div style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: isOverTime ? '#FF0000' : '#231F20', // Red for over-time, black for normal
                    borderRadius: '50%',
                    boxShadow: isOverTime ? '0 0 12px rgba(255, 0, 0, 0.9), 0 0 24px rgba(255, 0, 0, 0.5)' : 
                               '0 0 8px rgba(35, 31, 32, 0.8), 0 0 16px rgba(35, 31, 32, 0.4)',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}></div>
                )}
                
                {/* Running to indicator */}
                {isRunningTo && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#231F20', // Black center for contrast
                    borderRadius: '50%',
                    boxShadow: '0 0 6px rgba(35, 31, 32, 0.8), 0 0 12px rgba(35, 31, 32, 0.4)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}></div>
                )}
              </div>
              
              {/* Station name label */}
              <div style={{
                position: 'absolute',
                left: '40px', // Position to the right of the smaller sidebar
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.7rem', // Slightly larger text
                fontWeight: 'bold',
                color: isActive ? '#B1CDFF' : isRunningTo ? '#7195CD' : '#A09376',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                zIndex: 3
              }}>
                {stop.name}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* CSS Animation for pulse effect */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.2); }
          }
        `
      }} />
    </div>
  );
}
