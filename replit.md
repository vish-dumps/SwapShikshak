# SwapShikshak - Mutual Transfer Platform for Government Teachers

## Overview

SwapShikshak is a web-based platform designed to help government teachers in Bihar find mutual transfer partners. The application allows teachers to register their preferences, find matching partners, and connect securely to facilitate mutual transfers. The platform addresses the challenge of teachers being posted far from their hometowns by providing a modern, efficient alternative to manual searching through WhatsApp groups.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend:

**Frontend Architecture:**
- React-based single-page application (SPA) built with TypeScript
- Vite as the build tool and development server
- Tailwind CSS for styling with shadcn/ui component library
- Wouter for client-side routing
- TanStack Query for server state management
- React Hook Form with Zod validation for form handling

**Backend Architecture:**
- Express.js server with TypeScript
- RESTful API design with JWT-based authentication
- In-memory storage implementation with interface for future database integration
- Middleware for authentication, request logging, and error handling

**Database Strategy:**
- Drizzle ORM configured for PostgreSQL
- Schema defines users, teachers, transfer requests, and matches tables
- Database configuration ready for Neon Database integration
- Migration support through Drizzle Kit

## Key Components

### Authentication System
- JWT-based authentication with secure token storage
- User registration and login functionality
- Protected routes and middleware for API security
- Session management with automatic token refresh

### Teacher Profile Management
- Comprehensive teacher profiles with personal and professional details
- Location-based preferences with district and coordinate storage
- Subject specialization and experience tracking
- Privacy controls for contact information

### Matching Algorithm
- Two-tier matching system: perfect matches and nearby teachers
- Perfect matches based on mutual district preferences
- Nearby matches using haversine distance calculations
- Scoring system for match quality assessment

### Transfer Request System
- Request creation and management between teachers
- Status tracking (pending, accepted, rejected)
- Notification system for request updates
- Communication facilitation between matched teachers

### User Interface
- Responsive design optimized for mobile and desktop
- Dashboard with overview statistics and recent activity
- Advanced filtering and search capabilities
- Card-based layout for easy teacher profile browsing

## Data Flow

1. **User Registration**: Teachers create accounts with email/password, then complete detailed profiles
2. **Profile Completion**: Teachers specify current location, home district, and transfer preferences
3. **Match Discovery**: System calculates matches based on location preferences and distance
4. **Connection**: Teachers send transfer requests to potential matches
5. **Communication**: Matched teachers can exchange contact information and coordinate transfers

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **bcryptjs**: Password hashing for security
- **jsonwebtoken**: JWT token generation and verification
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI component primitives

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation

## Deployment Strategy

**Development Environment:**
- Vite development server with hot module replacement
- In-memory storage for rapid prototyping
- Environment-specific configuration management

**Production Deployment:**
- Build process combines Vite frontend build with Node.js backend
- Static assets served from dist/public directory
- Database migrations handled through Drizzle Kit
- Environment variables for database connection and JWT secrets

**Infrastructure Requirements:**
- Node.js runtime environment
- PostgreSQL database (Neon Database recommended)
- SSL/TLS certificates for secure authentication
- CDN for static asset delivery (optional)

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Changelog

```
Changelog:
- July 06, 2025. Initial setup
```