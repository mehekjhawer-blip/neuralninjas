const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("email").isEmail().withMessage("valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("password must be at least 6 characters"),
    body("role").optional().isIn(["admin", "faculty", "student"]).withMessage("role must be admin, faculty, or student"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role = "student", department = null, year = null } = req.body;

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "A user with this email already exists." });

    const password_hash = bcrypt.hashSync(password, 10);
    const info = db
      .prepare("INSERT INTO users (name, email, password_hash, role, department, year) VALUES (?, ?, ?, ?, ?, ?)")
      .run(name, email, password_hash, role, department, year);

    const user = db.prepare("SELECT id, name, email, role, department, year FROM users WHERE id = ?").get(info.lastInsertRowid);
    const token = signToken(user);
    res.status(201).json({ user, token });
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password." });

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  }
);

// GET /api/auth/me
router.get("/me", authenticate, (req, res) => {
  const user = db.prepare("SELECT id, name, email, role, department, year, created_at FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});

module.exports = router;
