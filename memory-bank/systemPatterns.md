# System Patterns - Verisentinel

## Architecture Overview
Verisentinel follows a monolithic application architecture, built with a Next.js frontend and a Node.js backend. PostgreSQL is used as the primary database for storing all structured data.

## Key Technical Decisions
- **Frontend Framework:** Next.js (React) – chosen for its server-side rendering capabilities, routing features, and developer experience.
- **UI Component Library:** shadcn/ui – selected for consistent styling, accessibility, and ease of customization.
- **Backend Language:** TypeScript – provides static typing and improved code maintainability.
- **Database:** PostgreSQL – a robust and reliable relational database with strong support for data integrity and security.
- **Data Fetching & Caching:** TanStack React Query - simplifies data fetching, caching, and state management in the frontend.

## Component Relationships
- The Next.js frontend communicates with the Node.js backend via RESTful APIs.
- The backend interacts with PostgreSQL to store and retrieve data.
- Authentication is handled using NextAuth.js.

## Design Patterns
- **Repository Pattern:** Used for abstracting database access logic.
- **Component-Based Architecture:** Frontend built with reusable React components.
- **API-First Development:** Backend APIs designed before frontend implementation.
