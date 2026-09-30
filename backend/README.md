# RE:SET API

Backend for the laptop assessment, sanitization, and disposition platform. It is a Node.js, TypeScript, and Express service with PostgreSQL, Prisma, JWT authentication, role checks, and an append-only audit log.

Base URL: `http://localhost:5000/api`

Interactive docs: `http://localhost:5000/api/docs`

## Requirements

- Node.js 20+
- PostgreSQL 16

Docker is optional. From this folder:

```bash
docker compose up -d
```

## Setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

`npm run db:seed` creates only the administrator from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. It does not load sample devices.

`npm run db:seed:dev` adds a few development devices. It refuses to run when `NODE_ENV=production`.

The default administrator password in `.env.example` is for local setup. Replace `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ADMIN_PASSWORD` before any shared or production deployment.

## Roles

| Role | Access |
| --- | --- |
| `ADMIN` | Users, every workflow, audit, reports |
| `ASSESSOR` | Register devices, assess, upload assessment evidence |
| `SANITIZATION_OFFICER` | Record and verify wipes |
| `DISPOSITION_OFFICER` | Propose and complete disposition after approval |
| `VIEWER` | Read dashboards, devices, and reports |

Public registration is disabled. `POST /api/auth/register` and `POST /api/users` both require an admin token.

## Workflow

1. Register a device. Status becomes `RECEIVED`.
2. Start and complete an assessment.
3. Resale, donation, recycle, scrap, and sanitize-and-redeploy always require sanitization. An admin must approve it before an officer can start. Redeploy, repair, and reassign can waive sanitization. Hold parks the device.
4. A passed wipe requires an uploaded evidence file and records who performed it, who verified it, the tool, and the certificate number. A failure leaves the device in `SANITIZATION_IN_PROGRESS`.
5. Disposition is rejected until assessment is complete and any required wipe has passed. Completing it sets `REDEPLOYED`, `DISPOSED`, `RECYCLED`, or `SCRAPPED`.

Device rows are soft-deleted. Audit events cannot be updated or deleted through the API.

## Frontend

Point the web app at `API_BASE_URL` (`http://localhost:5000/api`). Send `Authorization: Bearer <accessToken>` on protected calls. Login returns:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": "15m",
    "user": { "id": "...", "email": "...", "name": "...", "role": "ADMIN" }
  }
}
```

Device list responses are paginated in `data.items` with `page`, `limit`, `total`, and `totalPages`. The React screens still read their local sample data until they are switched to these endpoints.

## Tests

```bash
npm test
```

Workflow, password, and HTTP validation tests do not need a running database. Dashboard and report queries do.
