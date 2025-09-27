import React from 'react';
import { EventProvider, useEvent } from './context/EventContext';
import { SimplePasswordPrompt } from './components/Auth/SimplePasswordPrompt';
import { SimpleEventDisplay } from './components/Event/SimpleEventDisplay';
import { SimpleAdminPanel } from './components/Admin/SimpleAdminPanel';

function AppContent() {
  const { state } = useEvent();

  if (!state.isAuthenticated) {
    return <SimplePasswordPrompt />;
  }

  if (state.isAdmin) {
    return <SimpleAdminPanel />;
  }

  return <SimpleEventDisplay />;
}

function App() {
  return (
    <EventProvider>
      <AppContent />
    </EventProvider>
  );
}

export default App;
