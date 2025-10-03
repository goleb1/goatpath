import React, { useState, useEffect } from 'react';
import { getAuth } from '../../firebase';

const ADMIN_PASSWORD = '2025';
const ADMIN_EMAIL = 'jpgolebie@gmail.com'; // You can change this to match your Firebase user
const AUTH_STORAGE_KEY = 'goatpath_admin_auth';

interface AdminLoginProps {
  onAuthenticated: () => void;
}

export function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check for existing Firebase authentication on mount
  useEffect(() => {
    const checkFirebaseAuth = async () => {
      try {
        const { onAuthStateChanged } = await import('firebase/auth');
        
        const auth = getAuth();
        if (auth) {
          onAuthStateChanged(auth, (user) => {
            if (user) {
              console.log('✅ User already authenticated:', user.email);
              onAuthenticated();
            }
          });
        } else {
          console.warn('⚠️ Firebase Auth not available, using local password');
          // Fallback to local password check
          const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
          if (savedAuth) {
            try {
              const authData = JSON.parse(savedAuth);
              const authTime = new Date(authData.timestamp);
              const now = new Date();
              const hoursDiff = (now.getTime() - authTime.getTime()) / (1000 * 60 * 60);

              if (hoursDiff < 24) {
                onAuthenticated();
              } else {
                localStorage.removeItem(AUTH_STORAGE_KEY);
              }
            } catch {
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Firebase Auth not available, using local password');
        // Fallback to local password check
        const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedAuth) {
          try {
            const authData = JSON.parse(savedAuth);
            const authTime = new Date(authData.timestamp);
            const now = new Date();
            const hoursDiff = (now.getTime() - authTime.getTime()) / (1000 * 60 * 60);

            if (hoursDiff < 24) {
              onAuthenticated();
            } else {
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
          } catch {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      }
    };

    checkFirebaseAuth();
  }, [onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError('');

    try {
      // Try Firebase Authentication first
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      
      const auth = getAuth();
      if (auth) {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
        console.log('✅ Authenticated with Firebase');
        onAuthenticated();
      } else {
        throw new Error('Firebase Auth not available');
      }
    } catch (firebaseError: any) {
      console.warn('Firebase auth failed:', firebaseError.message);

      // Fallback to local password check
      if (password === ADMIN_PASSWORD) {
        const authData = {
          authenticated: true,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        console.log('✅ Authenticated with local password');
        onAuthenticated();
      } else {
        setError('Invalid access code');
        setPassword('');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const addDigit = (digit: string) => {
    if (password.length < 4) {
      setPassword(password + digit);
      setError('');
    }
  };

  const removeDigit = () => {
    setPassword(password.slice(0, -1));
    setError('');
  };

  const clearPassword = () => {
    setPassword('');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#231F20',
      padding: '1rem',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      <div style={{ width: '100%', maxWidth: '28rem' }}>
        <div style={{
          backgroundColor: '#324E80',
          border: '2px solid #A09376',
          padding: '2rem',
          borderRadius: '0.5rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#EBE4C1',
              marginBottom: '0.5rem'
            }}>
              ADMIN ACCESS
            </h1>
            <div style={{ color: '#A09376', fontSize: '0.875rem' }}>
              ═══════════════════════════════
            </div>
            <p style={{ color: '#B1CDFF', marginTop: '1rem' }}>
              ENTER 4-DIGIT ACCESS CODE
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Password Display */}
            <div style={{
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#231F20',
                border: '2px solid #7195CD',
                color: '#EBE4C1',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '2rem',
                textAlign: 'center',
                letterSpacing: '0.5rem',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {password.split('').map((_, index) => (
                  <span key={index} style={{ marginRight: '0.5rem' }}>
                    {index < password.length ? '●' : '○'}
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                color: '#A09376',
                textAlign: 'center',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                {error.toUpperCase()}
              </div>
            )}

            {/* Number Pad */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => addDigit(digit.toString())}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#B1CDFF',
                    color: '#231F20',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseDown={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#7195CD';
                  }}
                  onMouseUp={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#B1CDFF';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#B1CDFF';
                  }}
                >
                  {digit}
                </button>
              ))}
            </div>

            {/* Bottom row with 0, Clear, Delete */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <button
                type="button"
                onClick={clearPassword}
                style={{
                  padding: '1rem',
                  backgroundColor: '#A09376',
                  color: '#EBE4C1',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                CLEAR
              </button>

              <button
                type="button"
                onClick={() => addDigit('0')}
                style={{
                  padding: '1rem',
                  backgroundColor: '#B1CDFF',
                  color: '#231F20',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                0
              </button>

              <button
                type="button"
                onClick={removeDigit}
                style={{
                  padding: '1rem',
                  backgroundColor: '#7195CD',
                  color: '#EBE4C1',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ←
              </button>
            </div>

            <button
              type="submit"
              disabled={password.length !== 4 || isAuthenticating}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                backgroundColor: (password.length === 4 && !isAuthenticating) ? '#B1CDFF' : 'rgba(177, 205, 255, 0.3)',
                color: (password.length === 4 && !isAuthenticating) ? '#231F20' : 'rgba(35, 31, 32, 0.5)',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 'bold',
                border: 'none',
                cursor: (password.length === 4 && !isAuthenticating) ? 'pointer' : 'not-allowed',
                fontSize: '1rem'
              }}
            >
              {isAuthenticating ? 'AUTHENTICATING...' : 'ENTER'}
            </button>
          </form>

          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#7195CD'
          }}>
            AUTHORIZED PERSONNEL ONLY
          </div>
        </div>
      </div>
    </div>
  );
}