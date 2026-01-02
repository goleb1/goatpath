import type { Event } from '../types/Event';

export const leTour2025: Event = {
  id: 'letour2025',
  title: 'Le Tour de South Hillbillies 2025',
  date: '2025-10-04',
  password: 'hillbillies2025',
  adminPassword: 'admin2025',
  status: 'scheduled',
  currentStopIndex: 0,
  stops: [
    {
      id: 'stop1',
      name: 'Grimm Central',
      address: '123 Maple Street',
      position: 0,
      distanceToNext: '2.0 miles',
      status: 'pending'
    },
    {
      id: 'stop2',
      name: 'McGee Metro',
      address: '456 Oak Avenue',
      position: 1,
      distanceToNext: '1.0 miles',
      status: 'pending'
    },
    {
      id: 'stop3',
      name: 'Brasacchio Boulevard',
      address: '789 Pine Road',
      position: 2,
      distanceToNext: '1.6 miles',
      status: 'pending'
    },
    {
      id: 'stop4',
      name: 'Styler Station',
      address: '234 Elm Street',
      position: 3,
      distanceToNext: '0.9 miles',
      status: 'pending'
    },
    {
      id: 'stop5',
      name: 'Holliday Heights',
      address: '567 Cedar Lane',
      position: 4,
      distanceToNext: '2.9 miles',
      status: 'pending'
    },
    {
      id: 'stop6',
      name: 'Albert Avenue',
      address: '890 Birch Drive',
      position: 5,
      distanceToNext: '2.1 miles',
      status: 'pending'
    },
    {
      id: 'stop7',
      name: 'Baird Terminal',
      address: '345 Willow Court',
      position: 6,
      distanceToNext: '1.2 miles',
      status: 'pending'
    },
    {
      id: 'stop8',
      name: 'Golebie Grand',
      address: '678 Spruce Way',
      position: 7,
      distanceToNext: '2.1 miles',
      status: 'pending'
    },
    {
      id: 'stop9',
      name: 'Baldasare Union',
      address: '901 Aspen Boulevard',
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