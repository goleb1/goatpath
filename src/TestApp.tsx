import React from 'react';

function TestApp() {
  return (
    <div style={{ 
      backgroundColor: '#0a0a0a', 
      color: '#00ff00', 
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      <h1>🎯 GOATPATH TEST</h1>
      <p>If you can see this, React is working!</p>
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        border: '2px solid #00ff00', 
        padding: '1rem', 
        marginTop: '1rem' 
      }}>
        <h2>LE TOUR DE SOUTH HILLBILLIES</h2>
        <p style={{ color: '#ffbf00' }}>Loading the full application...</p>
      </div>
    </div>
  );
}

export default TestApp;