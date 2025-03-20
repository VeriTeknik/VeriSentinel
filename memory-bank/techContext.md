# Tech Context - Verisentinel

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling and development server
- Tailwind CSS for styling
- shadcn/ui components (Radix UI primitives)
- Wouter for routing (lightweight alternative to React Router)
- React Query for server state management
- React Hook Form for form handling
- Zod for validation
- Framer Motion for animations

### Backend
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Session-based authentication with Passport.js
- WebSocket support for real-time features
- Express Session with PostgreSQL store

### Development Tools
- TypeScript for type safety
- ESBuild for server-side code bundling
- Vite for client-side development and bundling
- Drizzle Kit for database migrations
- Tailwind CSS for styling

## Project Structure

```
verisentinel/
├── client/                 # Frontend application
│   ├── src/               # React application source
│   └── index.html         # Entry HTML file
├── server/                # Backend application
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database configuration
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Storage related logic
│   └── vite.ts           # Vite server integration
├── shared/               # Shared code between client and server
├── scripts/              # Utility scripts
└── attached_assets/      # Static assets
```

## Key Dependencies

### Frontend Dependencies
- @radix-ui/* - UI primitives
- @tanstack/react-query - Server state management
- wouter - Routing
- react-hook-form - Form management
- zod - Schema validation
- framer-motion - Animations
- reactflow - Flow diagrams
- recharts - Charts and visualizations

### Backend Dependencies
- express - Web framework
- drizzle-orm - Database ORM
- passport - Authentication
- express-session - Session management
- ws - WebSocket support

### Development Dependencies
- vite - Build tool and dev server
- typescript - Type checking
- tailwindcss - CSS framework
- drizzle-kit - Database migration tools
- tsx - TypeScript execution

## Environment Configuration

The application uses environment variables for configuration, defined in `.env` files:
- `.env` - Production environment variables
- `.env.example` - Template for environment variables

## Build and Development

### Development
```bash
npm run dev # Starts both client and server in development mode
```

### Production
```bash
npm run build # Builds both client and server
npm start # Starts the production server
```

### Database
```bash
npm run db:push # Apply database migrations
```

## Authentication

The application uses session-based authentication with Passport.js:
- Local strategy for username/password
- Session storage in PostgreSQL
- Secure session configuration with proper cookie settings

## API Structure

RESTful API endpoints are organized in `server/routes.ts` with proper middleware for:
- Authentication
- Request validation
- Error handling
- Session management

## Frontend Architecture

- Component-based architecture using React
- Tailwind CSS for styling with shadcn/ui components
- Client-side routing with Wouter
- Server state management with React Query
- Form handling with React Hook Form and Zod validation

## Database Schema

Managed through Drizzle ORM with:
- Type-safe queries
- Migration support
- Schema validation
- PostgreSQL-specific features

## Security Considerations

- Session-based authentication
- PostgreSQL for session storage
- Secure cookie configuration
- Input validation with Zod
- Type safety with TypeScript

## Authentication & Authorization

### Role-Permission System
- **TypeScript Types**
  - Permission strings
  - Role enumeration
  - Permission matrix type safety

- **React Hooks**
  - usePermissions for permission checks
  - Integration with useAuth
  - React Query for data management

- **API Middleware**
  - Express-style permission middleware
  - Session validation
  - Role-based access control

- **Data Management**
  - React Query for caching
  - Manual and automatic invalidation
  - Type-safe API requests

### Dependencies
- React Query v5
- Next.js
- TypeScript
- Zod for validation
- shadcn/ui components

### Development Setup
- TypeScript strict mode
- ESLint for code quality
- Prettier for formatting
- Jest for testing

### Technical Constraints
- Type safety requirements
- Performance considerations
- Security requirements
- Scalability needs

### Security Measures
- Role-based access control
- Permission validation
- Session management
- Error handling
- Audit logging
