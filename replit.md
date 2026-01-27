# WNY Esports Management System

## Overview

This is a full-stack esports tournament management system built for Wang Nam Yen Technical College in Thailand. The application enables students to register teams, track live match scores, view tournament brackets, and participate in real-time chat during competitions. The UI is entirely in Thai language with an esports/gaming dark theme aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript, built using Vite
- **Routing**: Wouter for client-side navigation (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS with custom esports theme (primary color #004080), CSS variables for theming
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Animations**: Framer Motion for page transitions and UI animations
- **Special Features**: Emoji picker for chat, real-time Firestore subscriptions

### Backend Architecture
- **Server**: Express.js with TypeScript running on Node.js
- **API Pattern**: Minimal REST API - most data operations happen client-side via Firebase
- **Build System**: Custom build script using esbuild for server, Vite for client
- **Development**: Vite dev server with HMR, proxied through Express

### Data Storage Solutions
- **Primary Database**: Firebase Firestore (client-side SDK) for real-time data
- **Schema Definition**: Drizzle ORM schemas in `shared/schema.ts` define data structures for type safety
- **Server Database**: PostgreSQL configured via Drizzle (currently minimal usage as Firebase handles most data)
- **Image Storage**: Cloudinary for team logos and event posters (unsigned uploads)

### Authentication Mechanisms
- **Provider**: Firebase Authentication
- **Methods Supported**:
  1. Student ID + Password (converted to fake email format: `${studentId}@wangnamyen.tech`)
  2. Google Sign-In (OAuth popup)
  3. Standard Email + Password
- **Error Handling**: Custom Thai language error messages mapped from Firebase error codes
- **State Management**: React Context (`AuthProvider`) wrapping the app

### Key Data Collections (Firestore)
- `users` - User profiles linked to Firebase Auth
- `teams` - Registered esports teams with member details
- `events` - Tournament events with configuration
- `matches` - Individual match results with real-time scores
- `live_chat` - Real-time chat messages during events

### File Structure Pattern
```
client/src/
├── components/     # Reusable UI components
├── components/ui/  # shadcn/ui primitives
├── hooks/          # Custom React hooks (auth, teams, toast)
├── lib/            # Utilities (firebase, queryClient)
├── pages/          # Route components
server/
├── index.ts        # Express server entry
├── routes.ts       # API route definitions
├── storage.ts      # In-memory storage (backup for Firebase)
shared/
├── schema.ts       # Drizzle schema definitions
├── routes.ts       # Shared route/API type definitions
```

## External Dependencies

### Firebase Services
- **Firebase Auth**: User authentication (Google OAuth, Email/Password)
- **Cloud Firestore**: Real-time NoSQL database for all application data
- **Environment Variables Required**:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

### Cloudinary
- **Purpose**: Image upload and optimization for team logos and event posters
- **Upload Method**: Unsigned client-side uploads
- **Environment Variables Required**:
  - `VITE_CLOUDINARY_CLOUD_NAME`
  - `VITE_CLOUDINARY_UPLOAD_PRESET`

### Database (PostgreSQL)
- **Purpose**: Server-side data persistence (optional, Firebase is primary)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Environment Variable**: `DATABASE_URL`
- **Migration Command**: `npm run db:push`

### Key NPM Dependencies
- `@tanstack/react-query` - Server state management
- `framer-motion` - Animations
- `emoji-picker-react` - Chat emoji support
- `axios` - HTTP client for Cloudinary uploads
- `wouter` - Lightweight routing
- `zod` - Schema validation
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations