import { Event } from '../context/EventContext';

export const leTour2025: Event = {
  id: 'letour2025',
  title: 'Le Tour de South Hillbillies 2025',
  date: '2025-01-01',
  password: 'hillbillies2025',
  adminPassword: 'admin2025',
  status: 'scheduled',
  currentStopIndex: 0,
  stops: [
    {
      id: 'stop1',
      name: 'The Starting Gate',
      address: '123 Start Street, Nashville, TN',
      position: 0,
      distanceToNext: '1.5 miles',
      status: 'pending'
    },
    {
      id: 'stop2',
      name: 'Hillbilly Haven',
      address: '456 Haven Lane, Nashville, TN',
      position: 1,
      distanceToNext: '1.2 miles',
      status: 'pending'
    },
    {
      id: 'stop3',
      name: 'The Watering Hole',
      address: '789 Water Way, Nashville, TN',
      position: 2,
      distanceToNext: '1.8 miles',
      status: 'pending'
    },
    {
      id: 'stop4',
      name: 'Mountain View Manor',
      address: '321 Mountain Road, Nashville, TN',
      position: 3,
      distanceToNext: '1.3 miles',
      status: 'pending'
    },
    {
      id: 'stop5',
      name: 'Country Corner',
      address: '654 Country Lane, Nashville, TN',
      position: 4,
      distanceToNext: '1.7 miles',
      status: 'pending'
    },
    {
      id: 'stop6',
      name: 'Bourbon Barn',
      address: '987 Bourbon Blvd, Nashville, TN',
      position: 5,
      distanceToNext: '1.4 miles',
      status: 'pending'
    },
    {
      id: 'stop7',
      name: 'The Final Frontier',
      address: '147 Frontier Ave, Nashville, TN',
      position: 6,
      distanceToNext: '1.6 miles',
      status: 'pending'
    },
    {
      id: 'stop8',
      name: 'Victory Villa',
      address: '258 Victory Street, Nashville, TN',
      position: 7,
      distanceToNext: '1.5 miles',
      status: 'pending'
    },
    {
      id: 'stop9',
      name: 'The Grand Finale',
      address: '369 Finale Road, Nashville, TN',
      position: 8,
      status: 'pending'
    }
  ],
  settings: {
    theme: 'retro',
    timerThresholds: { yellow: 10, red: 20 },
    showBeerAnimation: true
  },
  createdAt: '2024-12-01T00:00:00Z',
  updatedAt: '2024-12-01T00:00:00Z'
};