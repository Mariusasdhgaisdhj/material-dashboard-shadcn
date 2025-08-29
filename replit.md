# Replit.md

## Overview

This is a full-stack web application built with a modern tech stack featuring a React frontend with shadcn/ui components, an Express.js backend, and PostgreSQL database with Drizzle ORM. The application appears to be a dashboard/admin interface with user management, project tracking, and notification features.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Session Storage**: PostgreSQL-based session store (connect-pg-simple)

### Data Storage
- **Primary Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod schema validation
- **Connection**: Neon serverless driver for edge compatibility
- **Migrations**: Drizzle Kit for schema migrations

## Key Components

### Database Schema
The application defines three main entities:
- **Users**: Authentication and profile information
- **Projects**: Company projects with budget and completion tracking
- **Notifications**: User notification system with read status

### UI Components
- Comprehensive shadcn/ui component library
- Custom dashboard components (stats grid, project tables, mini charts)
- Responsive layout with sidebar navigation
- Authentication pages (sign-in/sign-up)

### Pages and Features
- **Dashboard**: Overview with statistics and project management
- **Profile**: User profile management with settings
- **Tables**: Data tables for authors and projects
- **Notifications**: Notification center with different alert types
- **Subscriptions**: Billing and subscription management with plan comparison
- **Authentication**: Sign-in and sign-up forms

## Data Flow

1. **Client Requests**: Frontend makes API calls through TanStack Query
2. **API Layer**: Express.js handles REST API endpoints with `/api` prefix
3. **Database Operations**: Drizzle ORM performs CRUD operations
4. **Response Handling**: JSON responses with proper error handling
5. **State Management**: TanStack Query caches and synchronizes server state

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM)
- Express.js with middleware
- Drizzle ORM and Drizzle Kit
- Neon Database serverless driver

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for icons
- Date-fns for date manipulation

### Development Tools
- TypeScript for type safety
- Vite for development and building
- ESBuild for server bundling
- Replit-specific development plugins

## Deployment Strategy

The application uses a monorepo structure with:
- **Development**: `npm run dev` starts the Express server with Vite middleware
- **Build**: `npm run build` compiles both frontend (Vite) and backend (ESBuild)
- **Production**: `npm start` runs the compiled server
- **Database**: `npm run db:push` applies schema changes

The build process:
1. Frontend assets are built to `dist/public`
2. Server code is bundled to `dist/index.js`
3. Static files are served by Express in production

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 01, 2025. Initial setup
- July 02, 2025. Added Subscriptions page with billing management, plan comparison, and usage tracking
- July 03, 2025. Changed primary colors from blue to black throughout the application
- July 03, 2025. Added comprehensive Theme Configurator with primary color, secondary color, border radius, and typography customization
- August 27, 2025. Successfully migrated project from Replit Agent to Replit environment
- August 27, 2025. Updated primary button styling with stone-themed design including gradients, shadows, and inset effects
- August 27, 2025. Applied stone-themed styling to active sidebar tabs for consistent design
- August 27, 2025. Integrated Recharts library across all chart components with comprehensive chart showcase including bar charts, line charts, area charts, and pie charts while maintaining beautiful design
- August 27, 2025. Successfully migrated project from Replit Agent to Replit environment
- August 27, 2025. Updated primary button styling with stone-themed design including gradients, shadows, and inset effects
- August 28, 2025. Added consistent page titles and descriptions above white card across all main pages
- August 28, 2025. Enhanced Layout component to support optional title and description props for better page structure
- August 28, 2025. Completed comprehensive stone palette conversion across entire application, replacing all gray colors with stone equivalents
- August 28, 2025. Updated Card component to remove shadows and add stone-200 borders for consistent clean design
- August 28, 2025. Implemented responsive sidebar with mobile burger menu, overlay, and slide transitions for improved mobile experience
- August 28, 2025. Added hero card with team diversity background image to dashboard page featuring compelling copy and CTA button
- August 28, 2025. Removed title and description from dashboard page for cleaner hero card presentation
- August 28, 2025. Created comprehensive documentation page with installation guide, component examples, and copy-paste functionality