import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { leTour2025 } from '../../data/letour2025';

export function SimplePasswordPrompt() {
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
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      padding: '1rem',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      <div style={{ width: '100%', maxWidth: '28rem' }}>
        <div style={{ 
          backgroundColor: '#1a1a1a', 
          border: '2px solid #00ff00', 
          padding: '2rem', 
          borderRadius: '0.5rem' 
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#00ff00', 
              marginBottom: '0.5rem' 
            }}>
              LE TOUR DE SOUTH HILLBILLIES
            </h1>
            <div style={{ color: '#ffbf00', fontSize: '0.875rem' }}>
              ═══════════════════════════════
            </div>
            <p style={{ color: '#00ff00', marginTop: '1rem' }}>
              ENTER PASSWORD TO CONTINUE
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#0a0a0a',
                  border: '2px solid #00ff00',
                  color: '#00ff00',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1rem'
                }}
                placeholder="PASSWORD"
                autoFocus
              />
            </div>
            
            {error && (
              <div style={{ 
                color: '#ff0000', 
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
                backgroundColor: '#00ff00',
                color: '#0a0a0a',
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
            color: 'rgba(0, 255, 0, 0.6)' 
          }}>
            AUTHORIZED PERSONNEL ONLY
          </div>
        </div>
      </div>
    </div>
  );
}