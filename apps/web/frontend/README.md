# LYNQ Frontend

This is the main frontend application for the LYNQ platform, built with React, TypeScript, and Vite.

## Project Structure

The project is located at `apps/web/frontend` within the monorepo.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- pnpm

### Installation

Install dependencies from the root of the monorepo:

```bash
pnpm install
```

### Development

To start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

### Building for Production

To build the application for production:

```bash
pnpm build
```

To preview the production build locally:

```bash
pnpm preview
```

### Linting

To run the linter:

```bash
pnpm lint
```

## Tech Stack

- **Framework:** React
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand + React Query
- **Routing:** React Router

## Environment Variables

Create an `.env` file (see `.env.example`) with at least:

```
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=LYNQ
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false
```

During production deployments, point `VITE_API_BASE_URL` to the deployed API, e.g. `https://api.example.com/api/v1`.

## Key Directories

- `src/`: Source code
- `public/`: Static assets
