# SmartWhiteboard

A smart, interactive whiteboard application built with React, TypeScript, and Vite.

## Features

- 🎨 Canvas-based drawing area
- 🖌️ Multiple drawing tools
- 📐 Layers panel support
- 🗺️ Mini map navigation
- 📱 PWA support (installable)
- ⚡ Built with Vite for fast performance

## Project Structure

```
SmartWhiteboard/
├── public/
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
├── src/
│   ├── components/
│   │   ├── CanvasArea.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LayersPanel.tsx
│   │   ├── LeftSidebar.tsx
│   │   ├── MiniMap.tsx
│   │   ├── Navigation.tsx
│   │   ├── RightSidebar.tsx
│   │   └── TopBar.tsx
│   ├── utils/
│   │   └── colorUtils.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── service-worker.ts
│   └── types.ts
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Android APK (via Capacitor)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor
npx cap init

# Build the app
npm run build

# Add Android platform
npx cap add android
npx cap copy

# Open in Android Studio
npx cap open android
```

## Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Capacitor** - Native Android/iOS wrapper
- **PWA** - Progressive Web App support

## License

MIT
