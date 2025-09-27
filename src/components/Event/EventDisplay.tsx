import React from 'react';
import { useEvent } from '../../context/EventContext';
import { StopCard } from '../Stop/StopCard';

export function EventDisplay() {
  const { state } = useEvent();
  
  if (!state.event) return null;

  const currentStop = state.event.stops[state.event.currentStopIndex];
  const progressPercentage = Math.round(
    (state.event.stops.filter(s => s.status === 'completed').length / state.event.stops.length) * 100
  );

  return (
    <div className="min-h-screen bg-retro-bg p-4">
      {/* Header */}
      <div className="bg-retro-bg-light border-2 border-retro-green p-4 mb-6">
        <h1 className="text-xl font-bold text-retro-green mb-2 font-mono text-center">
          {state.event.title.toUpperCase()}
        </h1>
        <div className="text-retro-amber font-mono text-center text-sm">
          ═══════════════════════════════
        </div>
        <div className="text-retro-green font-mono text-center mt-2 text-sm">
          REAL-TIME EVENT TRACKING
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-retro-green font-mono text-xs mb-1">
            <span>PROGRESS</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-retro-bg border border-retro-green h-2">
            <div 
              className="h-full bg-retro-green transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Current Stop Highlight */}
      {currentStop && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-retro-amber mb-4 font-mono">
            📍 CURRENT LOCATION
          </h2>
          <StopCard 
            stop={currentStop} 
            isActive={true}
            showTimer={true}
          />
        </div>
      )}

      {/* All Stops */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-retro-green mb-4 font-mono">
          🗺 COMPLETE ROUTE
        </h2>
        <div className="space-y-4">
          {state.event.stops.map((stop, index) => (
            <StopCard 
              key={stop.id}
              stop={stop} 
              isActive={index === state.event.currentStopIndex}
              showTimer={index === state.event.currentStopIndex}
            />
          ))}
        </div>
      </div>

      {/* Event Complete Message */}
      {state.event.stops.every(s => s.status === 'completed') && (
        <div className="bg-retro-bg-light border-2 border-retro-green p-6 text-center mb-6">
          <h2 className="text-2xl font-bold text-retro-green mb-2 font-mono">
            🎉 TOUR COMPLETE! 🎉
          </h2>
          <div className="text-retro-amber font-mono">
            Congratulations to all participants!
          </div>
          <div className="text-retro-green font-mono text-sm mt-2">
            Total distance: ~13 miles
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-retro-green/60 font-mono text-xs mt-8">
        Last updated: {new Date(state.event.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}