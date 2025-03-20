# Contributing to Verisentinel

First off, thank you for considering contributing to Verisentinel! It's people like you that make Verisentinel such a great tool.

## Code of Conduct

The Verisentinel project has a code of conduct that all contributors should follow. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Verisentinel. Following these guidelines helps maintainers understand your report, reproduce the behavior, and find related reports.

**Before Submitting A Bug Report:**
* Check the issue tracker to see if the bug has already been reported.
* Perform a cursory search to see if the problem has already been reported.

**How Do I Submit A Good Bug Report?**
Bugs are tracked as GitHub issues. Create an issue and provide the following information:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if possible
* Include any relevant logs

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Verisentinel, including completely new features and minor improvements to existing functionality.

**How Do I Submit A Good Enhancement Suggestion?**
* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful to most Verisentinel users

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the style guides
* Run the tests before submitting

## Development Setup

### Prerequisites

* Node.js (v18+)
* npm or yarn
* PostgreSQL database

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork
3. Install dependencies
```bash
npm install
```
4. Create a `.env` file in the root directory with your configuration (see `.env.example`)
5. Setup the database
```bash
# Create initial tables
tsx scripts/setup-db.ts

# Update schema with latest fields
tsx scripts/update-db-schema.ts

# Push any schema changes
npm run db:push
```
6. Run the development server
```bash
npm run dev
```

## Project Structure

- `/client`: Frontend React application
  - `/src/components`: Reusable UI components
  - `/src/pages`: Application pages
  - `/src/hooks`: Custom React hooks
  - `/src/lib`: Utility functions

- `/server`: Backend Express server
  - `/routes.ts`: API endpoints
  - `/storage.ts`: Data storage interfaces
  - `/auth.ts`: Authentication logic

- `/shared`: Code shared between client and server
  - `/schema.ts`: Database schema and type definitions

## Coding Guidelines

### JavaScript/TypeScript

* Use 2 spaces for indentation
* Use camelCase for variables and functions
* Use PascalCase for components and classes
* Use UPPER_CASE for constants
* Always add proper TypeScript types

### React Components

* Use functional components with hooks
* Keep components small and focused
* Use proper PropTypes or TypeScript interfaces
* Organize imports alphabetically
* Separate UI logic from business logic

### Database

* All database changes should start with schema changes in `shared/schema.ts`
* Never write raw SQL directly except in migration scripts
* Use Drizzle ORM for database operations
* Document complex database operations

## Testing

* Write unit tests for new features
* Ensure all tests pass before submitting a PR
```bash
npm run test
```

## Documentation

* Update documentation when adding new features
* Document complex functions and components
* Keep the README up to date

## Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally

## Code Review Process

The core team looks at Pull Requests on a regular basis. After feedback has been given, we expect responses within two weeks. After two weeks we may close the PR if it isn't showing any activity.

## Community

Join our community on [Discord](#) to get help or discuss the project.

Thank you for contributing to Verisentinel!