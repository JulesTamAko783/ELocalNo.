# Deployment Guide — Elokano IDE

## Prerequisites

- Node.js 18+ and npm
- A GitHub repository

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build for Production

```bash
cd frontend
npm run build
npm run preview   # optional — test the production build locally
```

The production build outputs to `frontend/dist/`.

## Deploy to Vercel

1. Push the `frontend/` folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Set **Root Directory** to `frontend`.
4. Set **Framework Preset** to `Vite`.
5. Click **Deploy**.

No environment variables are needed — the entire IDE runs client-side.

## Notes

- All lexing, parsing, semantic analysis, and interpretation runs in the browser.
- No backend or API is required.
- The `vercel.json` file handles SPA routing and security headers.
