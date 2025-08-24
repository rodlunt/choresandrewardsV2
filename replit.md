# Overview

This is a family chore tracking application called "Chores & Rewards" that helps parents and caregivers manage household tasks and reward systems for children. The app is designed as an offline-first Progressive Web App (PWA) that runs entirely in the browser without requiring a server or user authentication. Parents can add children to the system, assign chores with monetary values, track completion, maintain running totals of earnings, and process payouts while keeping a history of all transactions.

The application features a Brisbane Kids-inspired color palette (coral, teal, yellow, sky blue) and includes Duolingo-style feedback with sounds, haptic feedback, and confetti celebrations. It's built to be installable as a PWA and includes preparation for Android Play Store distribution via Trusted Web Activity (TWA).

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling, following the shadcn/ui component pattern
- **Styling**: Tailwind CSS with custom color variables for brand consistency
- **State Management**: TanStack Query (React Query) for data fetching and caching
- **Forms**: React Hook Form with Zod validation schemas

## Data Storage Strategy
- **Primary Storage**: IndexedDB using the `idb` wrapper library for structured client-side data persistence
- **Storage Interface**: Custom `AppStorage` class that handles CRUD operations for children, chores, payouts, and settings
- **Data Models**: Zod schemas for type-safe data validation and TypeScript type generation
- **Offline-First**: All data operations work without network connectivity

## Core Data Models
- **Children**: ID, name, running total in cents, creation date
- **Chores**: ID, title, value in cents, creation date
- **Payouts**: ID, child reference, amount in cents, timestamp for history tracking
- **Settings**: User preferences for sounds, haptics, confetti, and other app behaviors

## Progressive Web App Features
- **Service Worker**: Caches static assets and provides offline functionality
- **Manifest**: Complete PWA manifest with icons and display settings
- **Installability**: Meets PWA installation criteria with proper manifest and service worker
- **Responsive Design**: Mobile-first approach with touch-friendly interface

## User Experience Enhancements
- **Feedback Systems**: Canvas confetti celebrations, Web Audio API for sounds, navigator.vibrate for haptics
- **Accessibility**: ARIA labels, keyboard navigation, focus management, and reduced motion support
- **Currency Handling**: All monetary values stored as integer cents to avoid floating-point arithmetic issues
- **Data Portability**: JSON export/import functionality for backup and restore

## Development Architecture
- **Monorepo Structure**: Shared schemas between potential future server components
- **Build Process**: Vite for development and production builds
- **Type Safety**: Full TypeScript coverage with strict configuration
- **Code Organization**: Feature-based folder structure with clear separation of concerns

# External Dependencies

## Core Libraries
- **React Ecosystem**: React 18, React DOM, React Router (Wouter)
- **UI Framework**: Radix UI primitives for accessible component foundations
- **Styling**: Tailwind CSS with PostCSS for processing
- **Data Management**: TanStack Query for state management, Zod for schema validation
- **Storage**: idb library for IndexedDB operations, nanoid for ID generation

## Enhancement Libraries  
- **Visual Effects**: canvas-confetti for celebration animations
- **Date Handling**: date-fns for date formatting and manipulation
- **Utility Libraries**: clsx and tailwind-merge for conditional styling, class-variance-authority for component variants

## Development Tools
- **Build System**: Vite with React plugin and runtime error overlay
- **TypeScript**: Full type checking with strict mode enabled
- **Development Experience**: Replit-specific plugins for enhanced development workflow

## PWA and Mobile Support
- **Service Worker**: Custom implementation for caching and offline support
- **Audio**: Web Audio API for sound effects (complete.mp3, payout.mp3)
- **Haptics**: Native navigator.vibrate API for tactile feedback
- **Installability**: Standard PWA manifest and service worker for app store compatibility

## Database Configuration
- **Drizzle ORM**: Configured for PostgreSQL with Neon serverless driver (currently unused but configured for future server features)
- **Local Storage**: IndexedDB as primary storage mechanism with custom wrapper
- **Data Validation**: Runtime schema validation using Zod for all data operations