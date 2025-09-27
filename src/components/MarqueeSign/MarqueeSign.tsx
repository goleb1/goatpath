import { useEvent } from '../../context/useEventExport';

export function MarqueeSign() {
  const { state } = useEvent();

  console.log('MarqueeSign rendering, state:', state);

  // Test message for debugging
  const testMessage = "WELCOME ABOARD SHBAC EXPRESS";

  return (
    <div style={{
      width: '100%',
      height: '50px',
      backgroundColor: '#ff0000',
      border: '2px solid #ffbf00',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem'
    }}>
      <div style={{
        color: '#ffbf00',
        fontSize: '1rem',
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 'bold'
      }}>
        ★ {testMessage} ★
      </div>
    </div>
  );
}