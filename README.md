# FitTrack 🏋️

A full-stack fitness tracking web application built with React 19, Vite, Express, and TypeScript.

## Features

- 📊 **Dashboard** – Activity overview, daily streak, and progress charts
- 🏃 **GPS Walk/Run Tracker** – Real-time GPS route tracking with map visualization
- 💪 **3D Muscle Map** – Interactive Kinetic Anatomy Lab with Three.js
- 📚 **Exercise Library** – Browse exercises with flip-card details
- 🍎 **Nutrition Logging** – Log food intake and track macros
- ⚖️ **Weight Tracking** – Log and visualize weight over time
- 🏆 **Achievements & Badges** – Gamified fitness milestones
- 📅 **Activity Map** – Heatmap-style calendar of logged activities
- 🔔 **Workout Reminders** – Notification inbox and reminders
- 👤 **Profile & Settings** – Customizable user profile

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| UI Components | Radix UI, shadcn/ui, Framer Motion |
| 3D Graphics | Three.js, @react-three/fiber, @react-three/drei |
| Routing | Wouter |
| Backend | Express.js, TypeScript |
| Database | Drizzle ORM |
| Charts | Recharts |
| Maps | Google Maps API |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Run Tests

```bash
pnpm test
```

## Project Structure

```
fittrack/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route pages
│   │   ├── hooks/       # Custom React hooks
│   │   ├── contexts/    # React context providers
│   │   └── lib/         # Utility functions
├── server/              # Express backend
├── shared/              # Shared types and schemas
├── drizzle/             # Database migrations
└── patches/             # pnpm patches
```

## Data Storage

- User preferences, achievements, reminders, and daily streak: **Browser localStorage**
- Food, weight, and workout entries: **Saved locally + synced to Express API**
- Server data store: **In-memory** (resets on restart)

## License

MIT
