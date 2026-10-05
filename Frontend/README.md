# React + Vite

React 18 and Vite client for the AgriTrade supply-chain application. Requires
Node.js 20.19+ or 22.12+.

## Local setup

```bash
npm install
```

Copy `.env.example` to `.env` and make sure `VITE_API_URL` matches the backend
address. The default local API base is `http://localhost:5001/api`.

```bash
npm run dev
```

Open the local URL printed by Vite. The backend and MongoDB must be running for
sign-in and application data to load.

## Checks

```bash
npm run lint
npm run build
```

## Vercel deployment

Set the Vercel project root to `Frontend`, build command to `npm run build`, and
output directory to `dist`. Set `VITE_API_URL` to the deployed backend API URL
ending in `/api`. Add the deployed frontend origin to the backend's
`CORS_ORIGIN` setting. `vercel.json` provides the SPA route fallback.
