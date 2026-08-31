# HackShelf — Frontend

Next.js + TypeScript + Tailwind CSS frontend for HackShelf.

## Structure

```
frontend/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
├── hooks/         # TanStack Query hooks
├── lib/           # API client, auth, utilities
├── types/         # TypeScript types
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
└── .env.example
```

## Development

Run the frontend with Docker Compose:

```
docker compose up frontend
```

Or run locally with Next.js:

```
npm run dev
```
