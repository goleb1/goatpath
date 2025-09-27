import type { Event } from '../context/EventContext';

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
      address: '704 Crystal Drive',
      position: 0,
      distanceToNext: '2.0 miles',
      status: 'pending'
    },
    {
      id: 'stop2',
      name: 'McGee Metro',
      address: '64 Woodhaven Drive',
      position: 1,
      distanceToNext: '1.0 miles',
      status: 'pending'
    },
    {
      id: 'stop3',
      name: 'Brasacchio Boulevard',
      address: '217 Vernon Drive',
      position: 2,
      distanceToNext: '1.6 miles',
      status: 'pending'
    },
    {
      id: 'stop4',
      name: 'Styler Station',
      address: '631 Osage Road',
      position: 3,
      distanceToNext: '0.9 miles',
      status: 'pending'
    },
    {
      id: 'stop5',
      name: 'Holliday Heights',
      address: '1641 Williamsburg Road',
      position: 4,
      distanceToNext: '2.9 miles',
      status: 'pending'
    },
    {
      id: 'stop6',
      name: 'Albert Avenue',
      address: '2856 Broadway Avenue',
      position: 5,
      distanceToNext: '2.1 miles',
      status: 'pending'
    },
    {
      id: 'stop7',
      name: 'Baird Terminal',
      address: '1636 Bellaire Place',
      position: 6,
      distanceToNext: '1.2 miles',
      status: 'pending'
    },
    {
      id: 'stop8',
      name: 'Golebie Grand',
      address: '954 Norwich Avenue',
      position: 7,
      distanceToNext: '2.1 miles',
      status: 'pending'
    },
    {
      id: 'stop9',
      name: 'Baldasare Union',
      address: '325 Tampa Avenue',
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