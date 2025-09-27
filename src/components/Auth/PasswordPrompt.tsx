import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { leTour2025 } from '../../data/letour2025';

export function PasswordPrompt() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { dispatch } = useEvent();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === leTour2025.password) {
      dispatch({ type: 'SET_EVENT', payload: leTour2025 });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      dispatch({ type: 'SET_ADMIN', payload: false });
      setError('');
    } else if (password === leTour2025.adminPassword) {
      dispatch({ type: 'SET_EVENT', payload: leTour2025 });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      dispatch({ type: 'SET_ADMIN', payload: true });
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center retro-bg" style={{ padding: '1rem' }}>
      <div className="w-full max-w-md">
        <div className="retro-bg-light border-retro-green p-8 rounded-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold retro-green mb-2">
              LE TOUR DE SOUTH HILLBILLIES
            </h1>
            <div className="retro-amber text-sm">
              ═══════════════════════════════
            </div>
            <p className="retro-green mt-4">
              ENTER PASSWORD TO CONTINUE
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="PASSWORD"
                autoFocus
              />
            </div>
            
            {error && (
              <div className="retro-red text-center">
                {error.toUpperCase()}
              </div>
            )}
            
            <button
              type="submit"
              className="btn btn-primary w-full"
            >
              ENTER
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm" style={{ color: 'rgba(0, 255, 0, 0.6)' }}>
            AUTHORIZED PERSONNEL ONLY
          </div>
        </div>
      </div>
    </div>
  );
}