# Tech Context - Verisentinel

## Technology Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js 20, TypeScript, Express (implicitly through Next.js)
- **Database:** PostgreSQL 15
- **ORM:** Drizzle ORM
- **Authentication:** NextAuth.js
- **Data Fetching:** TanStack React Query
- **Testing:** Jest, React Testing Library

## Development Setup
- **Node Version:** v20+
- **Package Manager:** npm or yarn
- **IDE:** VS Code recommended
- **Database Connection:** PostgreSQL server running locally or remotely.  Connection details are stored in environment variables.

## Technical Constraints
- The application is currently monolithic, which may limit scalability in the future.
- Reliance on third-party libraries (shadcn/ui, NextAuth.js) introduces potential dependencies and maintenance overhead.
- Security considerations must be prioritized throughout development to protect sensitive data.
