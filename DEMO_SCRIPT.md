# Short Technical Demo Script (~3–4 minutes)

Record your screen (OBS, or Windows/Mac built-in recorder) following this sequence. Have two windows open: a terminal and Postman.

## 1. Show the project (20s)
- Open the repo in your editor. Briefly show `src/routes/notices.js` and `src/db.js`.
- Say: "This is a Node.js/Express backend with a SQLite database — no external services, runs anywhere for free."

## 2. Start the server (20s)
```bash
npm install
npm run seed
npm start
```
- Show the console log: `VNRVJIET CAMS API running on http://localhost:4000`
- Hit `GET http://localhost:4000/health` in the browser or Postman to show it's alive.

## 3. Auth flow (40s)
In Postman (or curl):
- **Login as student** (`mehek.student@vnrvjiet.in` / `Student@123`) → show the JWT returned.
- **Login with wrong password** → show the `401` failure response.

## 4. Notices — student view (30s)
- `GET /api/notices` with the student token → show the list of seeded notices (exam, placement, event, urgent).
- Point out filtering: `GET /api/notices?category=placement`.

## 5. Notices — faculty/admin actions (60s)
- Login as faculty (`faculty.rao@vnrvjiet.in` / `Faculty@123`).
- `POST /api/notices` → create a new notice → show `201` and the returned record.
- Try the same `POST` with the **student** token → show `403 Forbidden`. This demonstrates role-based access control.
- `PUT /api/notices/:id` → update the notice you just created.

## 6. Acknowledgment tracking (30s)
- As the student, `POST /api/notices/:id/ack` → show `201`.
- As faculty, `GET /api/notices/:id/ack` → show the student now appears in the read-receipt list.

## 7. Validation & error handling (30s)
- `POST /api/notices` with no `title` → show the `400` with the field-level validation error.
- `GET /api/notices/999999` → show `404 Notice not found`.

## 8. Wrap-up (15s)
- Mention: JWT auth, role-based authorization, input validation, SQLite (zero-cost persistence), and the Postman collection with paired success/failure tests for every endpoint.
- Show the repo's README for setup + deployment instructions.

---

**Tip:** If you'd rather not narrate live, run through this same sequence in Postman with the provided collection (`postman/VNRVJIET_CAMS.postman_collection.json`) — each request has a name like "Create notice - failure (student forbidden)" that doubles as your talking points, and the built-in test assertions turn green/red on screen as you go, which reads well on video.
