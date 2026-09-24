const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// GET /api/users  (admin only)
router.get("/", authenticate, authorize("admin"), (req, res) => {
  const rows = db.prepare("SELECT id, name, email, role, department, year, created_at FROM users ORDER BY id ASC").all();
  res.json({ data: rows, count: rows.length });
});

// GET /api/users/:id (admin only)
router.get("/:id", authenticate, authorize("admin"), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = db.prepare("SELECT id, name, email, role, department, year, created_at FROM users WHERE id = ?").get(id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ data: user });
});

module.exports = router;
