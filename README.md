# Uptime Sentinel

Uptime Sentinel monitors websites on a schedule, records response history, sends email alerts when availability changes, and streams status changes to authenticated dashboards.

## Requirements

- Node.js 20.19 or newer
- MySQL 8 or newer, local or hosted
- SMTP credentials for email alerts

## Run locally

1. Install backend dependencies and create the local environment file:

   ```powershell
   cd backend
   npm install
   Copy-Item .env.example .env
   ```

2. Create the application database in MySQL if it does not exist:

   ```sql
   CREATE DATABASE uptime_sentinel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, and the SMTP values in `backend/.env`. For Gmail, use an app password, not your account password. Use a long, unique JWT secret.

4. Start the API and scheduler (the tables are created automatically):

   ```powershell
   npm run dev
   ```

5. In a second terminal, install and start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

6. Open the Vite URL shown in the terminal (normally `http://localhost:5173`), register, and add a monitor. The API defaults to `http://localhost:5000`; frontend overrides are `VITE_API_URL` and `VITE_SOCKET_URL`.

Email alerts require working SMTP settings. Monitoring and the dashboard work without SMTP, but alert delivery will fail and be reported by the backend.

## Verification

Run backend security tests and production frontend build:

```powershell
cd backend
npm test
cd ../frontend
npm run build
```

## Features

- JWT authentication with bcrypt-hashed passwords and owner-scoped site APIs
- MySQL persistence through Sequelize with foreign-key cascade deletion and indexed history queries
- Site creation, editing, pause/resume, deletion, check history, and alert history
- Checks dispatched by a 30-second `node-cron` tick with per-site intervals and a 10-second HTTP timeout
- Transition-based down/recovery alerts with measured downtime duration
- Authenticated Socket.io connections that can subscribe only to the owner's site rooms
- 24-hour, 7-day, and 30-day uptime summaries, response-time charts, and check timelines
- Public status pages at `/status/:publicSlug`
- URL validation for HTTP/HTTPS only, private/special-use address rejection, and DNS-result checks during each outbound request, including redirects
