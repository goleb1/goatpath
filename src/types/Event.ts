export interface CustomBranding {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
  };
  logo?: string;
}

export interface Stop {
  id: string;
  name: string;
  address: string;
  position: number;
  distanceToNext?: string;
  status: 'pending' | 'active' | 'completed';
  arrivalTime?: string;
  departureTime?: string;
  duration?: number;
}

export interface EventSettings {
  theme: 'retro' | 'modern' | 'custom';
  timerThresholds: { yellow: number; red: number };
  showBeerAnimation: boolean;
  customBranding?: CustomBranding;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  password: string;
  adminPassword: string;
  status: 'scheduled' | 'active' | 'completed';
  stops: Stop[];
  settings: EventSettings;
  createdAt: string;
  updatedAt: string;
  currentStopIndex: number;
}