# CivicEvents+

A civic events platform where residents browse and register for local events, listen to audio announcements, watch promo videos and receive notifications, and where admins manage all of that content and the user accounts.

- `frontend/` - the static multi-page UI (HTML, Tailwind CSS, jQuery). This is the work submitted for the summative.
- `backend/` - the provided Node.js + Express + PostgreSQL API that the frontend talks to.
- `video-demo/` - the link to the demo video (see [Demo video](#demo-video)).

## Demo video

The link to the demo video is in the [`video-demo/`](video-demo/README.md) folder: https://youtu.be/3_9YNXhv8kQ

## Prerequisites

- Node.js 18 or newer
- PostgreSQL 15 or newer, either installed locally or run with Docker
- A way to serve static files: the VS Code **Live Server** extension, or Python 3

## Run the application locally

All commands are run from the repository root unless a step says otherwise.

### 1. Set the environment variables

The backend reads its settings from `backend/.env`. [`backend/.env.example`](backend/.env.example) is a template listing every variable. If `backend/.env` does not exist yet, create it from the template:

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and set the values for your machine:

| Variable | Required | Description | Example |
|---|---|---|---|
| `DB_USER` | yes | PostgreSQL user | `postgres` |
| `DB_PASS` | yes | Password for that user | `<your password>` |
| `DB_HOST` | yes | Database host | `localhost` |
| `DB_PORT` | yes | Database port | `5432` |
| `DB_NAME` | yes | Database name | `civic-events-db` |
| `JWT_SECRET` | yes | Secret used to sign login tokens | `<any long random string>` |
| `PORT` | no | Port the API listens on (default `4000`) | `4000` |
| `NODE_ENV` | no | Set to `development` to include stack traces in error responses | `development` |

The frontend has no environment variables. Its only setting is the backend URL, covered in [Connect the frontend to the backend](#connect-the-frontend-to-the-backend).

### 2. Create the database

Use **one** of the two options. The user, password, port and database name must match `backend/.env`.

**Option A - PostgreSQL installed locally**

```bash
psql -U postgres -h localhost -c 'CREATE DATABASE "civic-events-db";'
```

```bash
psql -U postgres -h localhost -d civic-events-db -f backend/migrations/001_create_tables.sql
```

**Option B - PostgreSQL in Docker**

```bash
docker run -d --name civic-events-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=<your DB_PASS> -e POSTGRES_DB=civic-events-db -p 127.0.0.1:5432:5432 -v civic-events-pgdata:/var/lib/postgresql/data postgres:16-alpine
```

```bash
docker exec -i civic-events-postgres psql -U postgres -d civic-events-db < backend/migrations/001_create_tables.sql
```

Later, start and stop the same database with `docker start civic-events-postgres` and `docker stop civic-events-postgres`.

### 3. Start the backend

```bash
npm --prefix backend install
```

```bash
npm --prefix backend run dev
```

The API is ready when the terminal shows:

```
CivicEvents+ backend listening on port 4000
Connected to PostgreSQL
```

You can also check it with `curl http://localhost:4000/health`, which returns `{"ok":true,"env":"development"}`.

### 4. Start the frontend

The frontend is plain HTML with no build step, so it only needs to be served over HTTP. Use either:

- **VS Code Live Server:** open the `frontend/` folder, right-click `login.html` and choose **Open with Live Server**.
- **Python:**

  ```bash
  python3 -m http.server 5500 --directory frontend
  ```

Then open http://localhost:5500/login.html.

### 5. Create an account

- **Regular user:** use the sign-up page at http://localhost:5500/signup.html.
- **Admin:** the sign-up page never sends a role, so create the first admin through the API:

  ```bash
  curl -X POST http://localhost:4000/api/auth/signup -H "Content-Type: application/json" -d '{"full_name":"Admin","email":"admin@example.com","password":"Secret@123","role":"admin"}'
  ```

Passwords need at least 8 characters, with an uppercase letter, a lowercase letter, a number and a special character.

## Connect the frontend to the backend

The frontend reaches the provided backend through two values in [`frontend/js/config.js`](frontend/js/config.js):

```js
const API_BASE = "http://localhost:4000/api";
const UPLOADS_BASE = "http://localhost:4000";
```

- **Backend API base URL:** `http://localhost:4000/api`. Every request the frontend makes goes to this address, for example `POST http://localhost:4000/api/auth/login`.
- **Uploads base URL:** `http://localhost:4000`. Event images, announcement audio and promo videos are served from `http://localhost:4000/uploads/...`.

These defaults match a backend started as described above, so nothing needs changing for a local run. If the backend runs on another host or port (for example because `PORT` was changed), edit both values in `frontend/js/config.js` and reload the page.

Every route except `/auth/signup` and `/auth/login` needs an `Authorization: Bearer <token>` header. The frontend adds it automatically after login; see [`frontend/js/api.js`](frontend/js/api.js). The backend allows requests from any origin, so the frontend can be served from any local port.

## More documentation

- [`frontend/README.md`](frontend/README.md) - features, folder structure, role guards and known backend limits
- [`frontend/API_NOTES.md`](frontend/API_NOTES.md) - the endpoints the frontend uses
- [`backend/README.md`](backend/README.md) - the provided backend's own setup guide and Postman collection
