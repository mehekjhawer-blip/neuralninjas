# VNRVJIET CAMS — Backend API

**Campus Announcement & Management System** — a real backend service (Node.js + Express + SQLite) that powers a role-based notice board for students, faculty, and admins. Built standalone, with no dependency on any third-party app builder and no paid hosting or domain required.

## Features

- JWT authentication with three roles: `admin`, `faculty`, `student`
- Notices with category (`academic`, `event`, `placement`, `exam`, `general`, `urgent`), priority, department/year targeting, and optional expiry
- Read/acknowledgment tracking — see which students have seen a notice
- Role-based authorization (only admin/faculty can post; only the poster or an admin can edit/delete)
- Input validation with clear error messages for every failure path
- SQLite storage — a single file, zero setup, zero cost

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js + Express | Minimal, well-documented, easy to grade/review |
| Database | SQLite (`better-sqlite3`) | No server to install or pay for; the whole DB is one file |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` for password hashing | Stateless, standard, no session store needed |
| Validation | `express-validator` | Consistent 400 responses with field-level errors |

## Project Structure

```
vnrvjiet-cams-backend/
├── src/
│   ├── index.js           # App entry point / route mounting
│   ├── db.js               # SQLite connection + schema
│   ├── seed.js              # Sample data + test credentials
│   ├── middleware/
│   │   └── auth.js          # JWT verification + role guard
│   └── routes/
│       ├── auth.js          # /api/auth/*
│       ├── notices.js       # /api/notices/*
│       └── users.js         # /api/users/*
├── postman/
│   ├── VNRVJIET_CAMS.postman_collection.json
│   └── VNRVJIET_CAMS.postman_environment.json
├── .env.example
└── package.json
```

## Setup (runs 100% locally, free)

Requires Node.js 18+.

```bash
git clone <this-repo-url>
cd vnrvjiet-cams-backend
npm install
cp .env.example .env        # edit JWT_SECRET if you like
npm run seed                # creates data/cams.db with sample users + notices
npm start                   # server on http://localhost:4000
```

Health check: `GET http://localhost:4000/health`

## Test / Demo Credentials

Created by `npm run seed`:

| Role | Email | Password |
|---|---|---|
| admin | `admin@vnrvjiet.in` | `Admin@123` |
| faculty | `faculty.rao@vnrvjiet.in` | `Faculty@123` |
| student | `mehek.student@vnrvjiet.in` | `Student@123` |
| student | `arjun.student@vnrvjiet.in` | `Student@123` |

Sample notices (exam, placement, event, general, urgent categories) are seeded alongside them.

## API Reference

All endpoints except `/health`, `/api/auth/register`, and `/api/auth/login` require:
`Authorization: Bearer <token>`

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create an account |
| POST | `/api/auth/login` | public | Get a JWT |
| GET | `/api/auth/me` | any authenticated user | Current user profile |

### Notices
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/notices` | any authenticated user | List notices; filter by `category`, `department`, `year`, `priority`; paginate with `page`, `limit` |
| GET | `/api/notices/:id` | any authenticated user | Get one notice |
| POST | `/api/notices` | admin, faculty | Create a notice |
| PUT | `/api/notices/:id` | admin, or the faculty who posted it | Edit a notice |
| DELETE | `/api/notices/:id` | admin, or the faculty who posted it | Delete a notice |
| POST | `/api/notices/:id/ack` | any authenticated user | Mark a notice as read/acknowledged |
| GET | `/api/notices/:id/ack` | admin, faculty | See who has acknowledged a notice |

### Users
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/users` | admin | List all users |
| GET | `/api/users/:id` | admin | Get one user |

## Postman Collection

Import both files from `/postman` into Postman:
1. `VNRVJIET_CAMS.postman_environment.json` (select it as the active environment)
2. `VNRVJIET_CAMS.postman_collection.json`

Run the **Auth** folder first (the login requests auto-save tokens into environment variables used by the rest of the collection). The collection includes matched success **and** failure requests for every endpoint (wrong password, missing fields, forbidden role, not-found IDs, duplicate email, etc.) with built-in test assertions on status codes.

## Deploying for free (optional — no domain purchase needed)

You can submit this as-is (running locally) or deploy it at no cost:

- **Render** (recommended): New → Web Service → connect this GitHub repo → Build command `npm install`, Start command `npm start` → add env vars from `.env.example`. Render gives you a free `onrender.com` subdomain.
- **Railway**: similar flow, free trial tier, free `up.railway.app` subdomain.
- **Fly.io**: `fly launch` in this folder, free `fly.dev` subdomain.

None of these require buying a domain — the platform's free subdomain is enough for a submission link.

## Notes on scope

This backend is written independently to match the "VNRVJIET CAMS" concept (a campus notice board) and is not generated from or dependent on the base44 front end. If your base44 UI needs to talk to this backend, point its API calls at wherever you deploy this service (or `http://localhost:4000` while developing), and update CORS in `src/index.js` if you lock it down to a specific origin.
