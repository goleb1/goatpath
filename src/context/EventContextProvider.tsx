import { useReducer } from 'react';
import type { ReactNode } from 'react';
import { eventReducer, initialState } from './eventReducer';
import { EventContext } from './EventContextDefinition';

export function EventProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  return (
    <EventContext.Provider value={{ state, dispatch }}>
      {children}
    </EventContext.Provider>
  );
}
