# LYNQ Admin Dashboard

This is the admin dashboard for the LYNQ platform, built with Next.js.

## Project Structure

The project is located at `apps/web/admin` within the monorepo.

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

The application will be available at `http://localhost:3000` (or the port shown in the terminal).

### Building for Production

To build the application for production:

```bash
pnpm build
```

To start the production server:

```bash
pnpm start
```

### Linting

To run the linter:

```bash
pnpm lint
```

## Tech Stack

- **Framework:** Next.js
- **Language:** TypeScript
- **Styling:** Tailwind CSS

## Environment Variables

Create an `.env` file (see `.env.example`) with at least:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

For production deployments, point `NEXT_PUBLIC_API_URL` to the deployed API, e.g. `https://api.example.com/api/v1`.

## Key Directories

- `src/`: Source code
- `public/`: Static assets
