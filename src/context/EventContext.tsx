import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Define types directly here to avoid import issues
export interface Stop {
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

export interface EventSettings {
  theme: 'retro' | 'modern' | 'custom';
  timerThresholds: { yellow: number; red: number };
  showBeerAnimation: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  password: string;
  adminPassword: string;
  status: 'scheduled' | 'active' | 'completed';
  stops: Stop[];
  settings: EventSettings;
  createdAt: string;
  updatedAt: string;
  currentStopIndex: number;
}

interface EventState {
  event: Event | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

type EventAction =
  | { type: 'SET_EVENT'; payload: Event }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'UPDATE_STOP_STATUS'; payload: { stopId: string; status: Stop['status']; timestamp?: string } }
  | { type: 'ADVANCE_TO_NEXT_STOP' }
  | { type: 'RESET_EVENT' };

const initialState: EventState = {
  event: null,
  isAuthenticated: false,
  isAdmin: false,
};

function eventReducer(state: EventState, action: EventAction): EventState {
  switch (action.type) {
    case 'SET_EVENT':
      return { ...state, event: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_ADMIN':
      return { ...state, isAdmin: action.payload };
    case 'UPDATE_STOP_STATUS':
      if (!state.event) return state;
      const updatedStops = state.event.stops.map(stop => {
        if (stop.id === action.payload.stopId) {
          const updatedStop = { ...stop, status: action.payload.status };
          if (action.payload.status === 'active') {
            updatedStop.arrivalTime = action.payload.timestamp || new Date().toISOString();
          } else if (action.payload.status === 'completed') {
            updatedStop.departureTime = action.payload.timestamp || new Date().toISOString();
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
      return {
        ...state,
        event: { ...state.event, stops: updatedStops, updatedAt: new Date().toISOString() }
      };
    case 'ADVANCE_TO_NEXT_STOP':
      if (!state.event) return state;
      const currentIndex = state.event.currentStopIndex;
      const nextIndex = Math.min(currentIndex + 1, state.event.stops.length - 1);
      return {
        ...state,
        event: { ...state.event, currentStopIndex: nextIndex }
      };
    case 'RESET_EVENT':
      return initialState;
    default:
      return state;
  }
}

const EventContext = createContext<{
  state: EventState;
  dispatch: React.Dispatch<EventAction>;
} | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  return (
    <EventContext.Provider value={{ state, dispatch }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}