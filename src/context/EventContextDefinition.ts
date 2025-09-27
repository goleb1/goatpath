import { createContext } from 'react';
import type { EventState, EventAction } from './eventReducer';

export const EventContext = createContext<{
  state: EventState;
  dispatch: React.Dispatch<EventAction>;
} | null>(null);
