# FindYourRoot - Family Tree Application

A beautiful, modern family tree application built with Next.js 16, React, TypeScript, and Tailwind CSS.

## ✨ Features

### Core Functionality
- 🌳 **Interactive Family Tree** - Visual representation with clickable nodes
- 🔍 **Advanced Search** - Real-time search with debouncing and advanced filtering
- 👤 **Person Details** - Beautiful modal dialogs with comprehensive information
- 💾 **Data Export** - Export in JSON, CSV, or PDF formats
- 🔗 **Share Functionality** - Share via native Web Share API or clipboard

### User Experience
- 🌓 **Dark/Light Mode** - Toggle with automatic system preference detection
- ⌨️ **Keyboard Shortcuts** - Navigate quickly (1-4 for tabs, T for theme)
- 👆 **Swipe Gestures** - Navigate between tabs on mobile
- 🔔 **Toast Notifications** - Real-time feedback for actions
- 📱 **Responsive Design** - Works seamlessly on all devices

### Settings & Preferences
- 💾 **Persistent Settings** - All preferences saved to localStorage
- 🔒 **Privacy Controls** - Toggle privacy, notifications, offline access
- 🎨 **Theme Persistence** - Remembered across sessions

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **State Management**: React Hooks

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout with PWA configuration
│   ├── page.tsx             # Main application page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── BottomNavigation.tsx # Bottom tab navigation
│   ├── TabContent.tsx       # Tab content router
│   └── tabs/                # Individual tab components
├── lib/                     # Utilities and configuration
│   ├── types.ts            # TypeScript type definitions
│   ├── data.ts             # Family tree data
│   └── store.ts            # Zustand state management
└── public/                  # Static assets
    └── manifest.json        # PWA manifest
```

## Customization

### Adding Family Members

Edit `lib/data.ts` to modify the family tree structure.

## License

MIT License
