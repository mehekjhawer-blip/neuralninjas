const express = require("express");
const { body, query, validationResult } = require("express-validator");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
const CATEGORIES = ["academic", "event", "placement", "exam", "general", "urgent"];
const PRIORITIES = ["low", "normal", "high"];

// GET /api/notices?category=&department=&year=&priority=&page=&limit=
router.get(
  "/",
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { category, department, year, priority } = req.query;
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const offset = (page - 1) * limit;

    let where = ["(expires_at IS NULL OR expires_at >= datetime('now'))"];
    const params = [];

    if (category) {
      if (!CATEGORIES.includes(category)) return res.status(400).json({ error: `category must be one of ${CATEGORIES.join(", ")}` });
      where.push("category = ?");
      params.push(category);
    }
    if (priority) {
      if (!PRIORITIES.includes(priority)) return res.status(400).json({ error: `priority must be one of ${PRIORITIES.join(", ")}` });
      where.push("priority = ?");
      params.push(priority);
    }
    if (department) {
      where.push("(target_department = 'ALL' OR target_department = ?)");
      params.push(department);
    }
    if (year) {
      where.push("(target_year IS NULL OR target_year = ?)");
      params.push(parseInt(year, 10));
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const rows = db
      .prepare(
        `SELECT notices.*, users.name AS posted_by_name
         FROM notices JOIN users ON users.id = notices.posted_by
         ${whereSql}
         ORDER BY datetime(notices.created_at) DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    const total = db.prepare(`SELECT COUNT(*) AS c FROM notices ${whereSql}`).get(...params).c;

    res.json({ data: rows, page, limit, total });
  }
);

// GET /api/notices/:id
router.get("/:id", authenticate, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id must be a number." });

  const notice = db
    .prepare(`SELECT notices.*, users.name AS posted_by_name FROM notices JOIN users ON users.id = notices.posted_by WHERE notices.id = ?`)
    .get(id);
  if (!notice) return res.status(404).json({ error: "Notice not found." });

  res.json({ data: notice });
});

// POST /api/notices  (admin, faculty only)
router.post(
  "/",
  authenticate,
  authorize("admin", "faculty"),
  [
    body("title").trim().notEmpty().withMessage("title is required"),
    body("content").trim().notEmpty().withMessage("content is required"),
    body("category").optional().isIn(CATEGORIES).withMessage(`category must be one of ${CATEGORIES.join(", ")}`),
    body("priority").optional().isIn(PRIORITIES).withMessage(`priority must be one of ${PRIORITIES.join(", ")}`),
    body("target_department").optional().isString(),
    body("target_year").optional().isInt({ min: 1, max: 4 }),
    body("expires_at").optional().isISO8601().withMessage("expires_at must be an ISO8601 date"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      title,
      content,
      category = "general",
      priority = "normal",
      target_department = "ALL",
      target_year = null,
      expires_at = null,
    } = req.body;

    const info = db
      .prepare(
        `INSERT INTO notices (title, content, category, priority, target_department, target_year, posted_by, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(title, content, category, priority, target_department, target_year, req.user.id, expires_at);

    const notice = db.prepare("SELECT * FROM notices WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json({ data: notice });
  }
);

// PUT /api/notices/:id (admin, or the faculty member who posted it)
router.put("/:id", authenticate, authorize("admin", "faculty"), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare("SELECT * FROM notices WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Notice not found." });

  if (req.user.role !== "admin" && existing.posted_by !== req.user.id) {
    return res.status(403).json({ error: "You can only edit notices you posted." });
  }

  const {
    title = existing.title,
    content = existing.content,
    category = existing.category,
    priority = existing.priority,
    target_department = existing.target_department,
    target_year = existing.target_year,
    expires_at = existing.expires_at,
  } = req.body;

  if (category && !CATEGORIES.includes(category)) return res.status(400).json({ error: `category must be one of ${CATEGORIES.join(", ")}` });
  if (priority && !PRIORITIES.includes(priority)) return res.status(400).json({ error: `priority must be one of ${PRIORITIES.join(", ")}` });

  db.prepare(
    `UPDATE notices SET title=?, content=?, category=?, priority=?, target_department=?, target_year=?, expires_at=?, updated_at=datetime('now')
     WHERE id=?`
  ).run(title, content, category, priority, target_department, target_year, expires_at, id);

  const updated = db.prepare("SELECT * FROM notices WHERE id = ?").get(id);
  res.json({ data: updated });
});

// DELETE /api/notices/:id (admin, or posting faculty)
router.delete("/:id", authenticate, authorize("admin", "faculty"), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare("SELECT * FROM notices WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Notice not found." });

  if (req.user.role !== "admin" && existing.posted_by !== req.user.id) {
    return res.status(403).json({ error: "You can only delete notices you posted." });
  }

  db.prepare("DELETE FROM notices WHERE id = ?").run(id);
  res.status(204).send();
});

// POST /api/notices/:id/ack  -- mark as read/acknowledged by the current user
router.post("/:id/ack", authenticate, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const notice = db.prepare("SELECT id FROM notices WHERE id = ?").get(id);
  if (!notice) return res.status(404).json({ error: "Notice not found." });

  try {
    db.prepare("INSERT INTO acknowledgments (notice_id, user_id) VALUES (?, ?)").run(id, req.user.id);
  } catch (err) {
    if (String(err).includes("UNIQUE")) {
      return res.status(200).json({ message: "Already acknowledged." });
    }
    return res.status(500).json({ error: "Could not record acknowledgment." });
  }

  res.status(201).json({ message: "Notice acknowledged." });
});

// GET /api/notices/:id/ack -- list who has acknowledged (admin/faculty only)
router.get("/:id/ack", authenticate, authorize("admin", "faculty"), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const notice = db.prepare("SELECT id FROM notices WHERE id = ?").get(id);
  if (!notice) return res.status(404).json({ error: "Notice not found." });

  const rows = db
    .prepare(
      `SELECT users.id, users.name, users.email, acknowledgments.read_at
       FROM acknowledgments JOIN users ON users.id = acknowledgments.user_id
       WHERE notice_id = ? ORDER BY read_at DESC`
    )
    .all(id);

  res.json({ data: rows, count: rows.length });
});

module.exports = router;
