import { useEvent } from '../../context/useEventExport';

export function MarqueeSign() {
  const { state } = useEvent();

  const getPresetMessage = () => {
    if (!state.event) return "WELCOME ABOARD SHBAC EXPRESS";

    const currentStop = state.event.stops[state.event.currentStopIndex];
    if (!currentStop) return "WELCOME ABOARD SHBAC EXPRESS";

    if (currentStop.status === 'active') {
      // At a station - use your existing station messages
      const stationMessages: Record<string, string> = {
        "Grimm Central": "NOW AT GRIMM CENTRAL - FUEL UP AND STRETCH THOSE LEGS!",
        "McGee Metro": "WELCOME TO MCGEE METRO - QUICK STOP FOR REFRESHMENTS!",
        "Brasacchio Boulevard": "NOW ARRIVING BRASACCHIO BOULEVARD - ENJOY THE VALLEY VIEWS!",
        "Styler Station": "BRIEF STOP AT STYLER STATION - SHORTEST SEGMENT AHEAD BUT DON'T GET TOO COMFORTABLE!",
        "Holliday Heights": "WELCOME TO HOLLIDAY HEIGHTS - CROSSING INTO BROOKLINE TERRITORY AHEAD!",
        "Albert Avenue": "QUICK PIT STOP AT ALBERT AVENUE - HALFWAY HOME, HILLBILLIES!",
        "Baird Terminal": "NOW AT BAIRD TERMINAL - PREPARE FOR THE STEEPEST CLIMB OF THE DAY!",
        "Golebie Grand": "PENULTIMATE STOP: GOLEBIE GRAND! ONE MORE SEGMENT TO GO!",
        "Baldasare Union": "THANK YOU FOR RIDING SHBAC EXPRESS - PLEASE EXIT SAFELY!"
      };
      return stationMessages[currentStop.name] || `NOW AT ${currentStop.name.toUpperCase()}`;
    } else if (currentStop.status === 'pending' && state.event.currentStopIndex > 0) {
      // En route to current stop (previous stop was completed)
      const previousStop = state.event.stops[state.event.currentStopIndex - 1];
      if (previousStop && previousStop.status === 'completed') {
        const enRouteMessages: Record<string, string> = {
          "McGee Metro": "NEXT STOP MCGEE METRO IN 2 MILES - WATCH YOUR STEP AND MIND THE HILLS!",
          "Brasacchio Boulevard": "EXPRESS SERVICE TO BRASACCHIO BOULEVARD - 1.0 MILE OF SCENIC SOUTH HILLS AHEAD!",
          "Styler Station": "EN ROUTE TO STYLER STATION - 1.6 MILES OF ROLLING TERRAIN, PLEASE HOLD ON!",
          "Holliday Heights": "NOW DEPARTING FOR HOLLIDAY HEIGHTS - ONLY 0.9 MILES! PACE YOURSELVES, HILLBILLIES!",
          "Albert Avenue": "CLIMBING 150 FEET OVER 2.9 MILES TO ALBERT AVENUE - STEADY AS SHE GOES!",
          "Baird Terminal": "ALL ABOARD FOR BAIRD TERMINAL - 2.1 MILES TO GO!",
          "Golebie Grand": "STEEPEST CLIMB AHEAD TO GOLEBIE GRAND - 1.2 MILES OF CHARACTER BUILDING!",
          "Baldasare Union": "FINAL APPROACH TO BALDASARE UNION - 2.1 MILES TO VICTORY!"
        };
        return enRouteMessages[currentStop.name] || `EN ROUTE TO ${currentStop.name.toUpperCase()}`;
      }
    } else if (currentStop.status === 'completed' && state.event.currentStopIndex === state.event.stops.length - 1) {
      // Last stop completed
      return "THANK YOU FOR RIDING SHBAC EXPRESS - PLEASE EXIT SAFELY!";
    }

    // Default: Event not started or first stop pending
    return "WELCOME ABOARD SHBAC EXPRESS!";
  };

  const displayMessage = state.event?.customMessage || getPresetMessage();

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
        ★ {displayMessage} ★
      </div>
    </div>
  );
}