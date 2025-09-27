# GoatPath - Live House Run Tracking

A real-time tracking application for "Le Tour de South Hillbillies 2025" - a house run event where participants can track their progress through multiple stops and see the current location and next destination.

## 🏃‍♂️ What is GoatPath?

GoatPath is a live tracking system designed for house runs and pub crawls. It allows participants to:

- **Track real-time progress** through multiple stops
- **See current location** and next destination
- **View complete route** with all stops
- **Get directions** to each location via Google Maps
- **Monitor progress** with visual indicators

## ✨ Features

### For Participants
- **Live Event Display**: See where the group currently is and what's next
- **Progress Tracking**: Visual progress bar showing completion percentage
- **Interactive Maps**: Click any address to open Google Maps directions
- **Retro Terminal UI**: Clean, terminal-style interface with green/amber color scheme
- **Real-time Updates**: Automatically updates as the event progresses

### For Administrators
- **Admin Control Panel**: Full control over event progression
- **Stop Management**: Mark arrivals and departures for each stop
- **Auto-advance**: Automatically moves to next stop when departing
- **Event Status**: Overview of completed, active, and pending stops
- **Emergency Reset**: Reset entire event if needed

### Security
- **Password Protection**: Separate passwords for participants and admins
- **Role-based Access**: Different interfaces for participants vs administrators

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd goatpath-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 🎯 How to Use

### For Participants
1. Enter the participant password when prompted
2. View the current stop and progress
3. Click on addresses to get directions
4. Monitor the complete route and your progress

### For Administrators
1. Enter the admin password to access the control panel
2. Use "ARRIVED" button when reaching a stop
3. Use "DEPARTED" button when leaving a stop
4. The system automatically advances to the next stop
5. Monitor event status and progress

## 🏗️ Technical Details

### Built With
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Context** for state management
- **Custom terminal-style UI** components

### Project Structure
```
src/
├── components/
│   ├── Admin/          # Admin control panels
│   ├── Auth/           # Authentication components
│   ├── Event/          # Event display components
│   ├── Stop/           # Stop-related components
│   └── Timer/          # Timer components
├── context/
│   └── EventContext.tsx # Global state management
├── data/
│   └── letour2025.ts   # Event data and stops
└── types/
    └── Event.ts        # TypeScript type definitions
```

### Key Components
- **EventContext**: Manages global state for authentication, event data, and stop progression
- **SimpleEventDisplay**: Main participant interface showing current location and route
- **SimpleAdminPanel**: Administrative interface for controlling event progression
- **SimplePasswordPrompt**: Authentication system with role-based access

## 🎨 Customization

### Event Configuration
Edit `src/data/letour2025.ts` to customize:
- Event title and date
- Stop locations and addresses
- Passwords (participant and admin)
- Event settings and themes

### Styling
The app uses a retro terminal theme with:
- Dark background (`#0a0a0a`)
- Green text (`#00ff00`) for primary elements
- Amber text (`#ffbf00`) for highlights
- Monospace font (JetBrains Mono)

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features
1. Create components in appropriate directories
2. Update types in `src/types/Event.ts` if needed
3. Modify `EventContext.tsx` for new state management
4. Update authentication logic if adding new roles

## 📱 Mobile Friendly

The application is designed to work well on mobile devices, making it perfect for participants to check on their phones during the house run.

## 🎉 Event Example

**Le Tour de South Hillbillies 2025** includes stops like:
- The Starting Gate
- Hillbilly Haven  
- The Watering Hole
- Mountain View Manor
- Country Corner
- Bourbon Barn
- The Final Frontier
- Victory Villa
- The Grand Finale

Each stop includes addresses, distances to the next stop, and real-time status tracking.

---

*Built for the South Hillbillies house run community. May your path be clear and your stops be legendary! 🍺*