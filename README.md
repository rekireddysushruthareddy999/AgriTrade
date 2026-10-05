# AgriTrade

AgriTrade is a full-stack agricultural trade and supply-chain management application. It tracks farmers and farms, produce lots, quality inspections, purchase orders, warehouse capacity, shipments and farmer settlements.

## Features

- JWT authentication with persistent sessions and password reset flow
- Role-aware access for administrators and operational users
- Farmer and farm management
- Farmer-owned produce lots and custom produce categories
- Lot lifecycle management with validated state transitions
- Quality inspection and grading
- Purchase-order creation, allocation, cancellation and delivery confirmation
- Warehouse inventory and capacity visibility
- Vehicle and shipment lifecycle tracking
- Farmer settlement generation and payment status
- Autocomplete search
- Route optimization utility using the included route optimizer
- Near-expiry alert job
- Responsive dashboard UI with loading, error and empty states

## Tech Stack

- Frontend: React 18, React Router, Axios, Vite
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- Authentication: JWT + bcryptjs
- Scheduling: node-cron

## Project Structure

```text
AgriTrade/
├── Backend/
│   ├── config/
│   ├── controllers/
│   ├── dsa/
│   ├── jobs/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── seed/
│   ├── utils/
│   └── server.js
├── Frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── styles/
│   └── vite.config.js
├── render.yaml
└── vercel.json
```

## Requirements

- Node.js 20.19+ or 22.12+
- npm 9+
- MongoDB 6+ or a MongoDB Atlas cluster

## Installation

### 1. Backend

```bash
cd Backend
npm install
```

Copy `.env.example` to `.env` and provide real values.

### 2. Frontend

```bash
cd Frontend
npm install
```

Copy `.env.example` to `.env`.

## Environment Variables

### Backend `.env`

```env
NODE_ENV=development
PORT=5001
MONGO_URL=mongodb://127.0.0.1:27017/agritrade
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:5174
MONGO_SERVER_SELECTION_TIMEOUT_MS=10000
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5001/api
```

Never commit `.env` files or production secrets.
The backend `PORT` and frontend `VITE_API_URL` must point to the same API port.
Production must provide `MONGO_URL`, `JWT_SECRET`, and `CORS_ORIGIN`; the
backend refuses to start with development database or JWT defaults when
`NODE_ENV=production`.

## Database Setup

Start MongoDB locally or create a MongoDB Atlas database, then set `MONGO_URL`.

Optional demo data:

```bash
cd Backend
npm run seed
```

The seed creates these demo accounts:

| Role   | Email                 | Password     |
| ------ | --------------------- | ------------ |
| Admin  | admin@agritrade.com   | Admin@12345  |
| Farmer | farmer1@agritrade.com | Farmer@12345 |
| Buyer  | buyer1@agritrade.com  | Buyer@12345  |

Change demo passwords before using the application outside a local demonstration.

## Running Locally

### Backend

```bash
cd Backend
npm install
npm run dev
```

The API runs on `http://localhost:5001` by default.

Health check: `GET /health`.

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5174`.

### Tests and checks

```bash
cd Backend
npm test
cd ../Frontend
npm run lint
npm run build
```

## API Documentation

Base URL: `/api`

| Area            | Endpoints                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Auth            | `/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/refresh` |
| Users           | `/users`                                                                                          |
| Farmers         | `/farmers`                                                                                        |
| Farms           | `/farms`                                                                                          |
| Produce         | `/produce-categories`                                                                             |
| Lots            | `/lots`                                                                                           |
| Inspections     | `/inspections`                                                                                    |
| Purchase orders | `/purchase-orders`                                                                                |
| Warehouses      | `/warehouses`                                                                                     |
| Vehicles        | `/vehicles`                                                                                       |
| Shipments       | `/shipments`                                                                                      |
| Settlements     | `/settlements`                                                                                    |
| Search          | `/search/autocomplete?q=...`                                                                      |
| Logistics       | `/logistics/optimize-route`                                                                       |

Protected endpoints require:

```text
Authorization: Bearer <JWT>
```

## Authentication

Public registration is limited to farmer and buyer roles. Administrator and operational accounts should be provisioned by an administrator/seed process rather than allowing arbitrary public elevation.

JWTs are persisted in browser local storage for the current application architecture. The API validates tokens on protected routes and the frontend refreshes the authenticated user when the application starts.

## Deployment

### Backend on Render

1. Create a Render Web Service from the repository.
2. Set the root directory to `Backend` or use the included `render.yaml`.
3. Build command: `npm ci --omit=dev`.
4. Start command: `npm start`.
5. Set `MONGO_URL`, `JWT_SECRET`, and `CORS_ORIGIN` in Render environment variables.
6. Set `CORS_ORIGIN` to the exact deployed frontend origin.
7. Confirm `/health` returns HTTP 200.

### Frontend on Vercel

1. Import the repository into Vercel.
2. Set the frontend project/root directory to `Frontend` if configuring it directly.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Set `VITE_API_URL` to the deployed backend API base URL, for example `https://your-api.example.com/api`.
6. Ensure SPA fallback/rewrite support is enabled so direct navigation to React routes works.

## Troubleshooting

- **MongoDB connection fails:** verify `MONGO_URL`, network access and MongoDB credentials.
- **CORS error:** make `CORS_ORIGIN` exactly match the frontend origin.
- **Registration or API network error:** confirm the backend's printed port matches `VITE_API_URL`, restart both servers after changing environment files, and open the Vite URL printed by the frontend.
- **401 after login:** verify the frontend is using the same backend URL and that `JWT_SECRET` is stable between restarts.
- **Empty lists:** verify MongoDB is connected and run `npm run seed` for demo data.
- **Vite build issue after copying archived `node_modules`:** delete `node_modules` and run `npm install` on the target machine. Dependencies should always be installed from the lockfile rather than copied across operating systems.

## Verification Checklist

- Start MongoDB, then run the backend and confirm `/health` reports `database: connected`.
- Run the frontend and open the URL Vite prints; register and sign in as a farmer.
- Confirm the farmer sees their own profile, can create a lot for that profile, and cannot create a lot for another farmer.
- On the lot form, choose **Other**, enter a category and unit, and submit a lot.
- Sign in as a buyer and confirm purchase orders are limited to that buyer.
- Sign in as an admin and verify dashboard, farmers, lots, inspections, purchasing, warehouses, shipments, settlements, and admin settings.
- Confirm operational routes reject roles without permission and production startup fails when required secrets are missing.
