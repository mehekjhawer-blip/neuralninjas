require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const noticeRoutes = require("./routes/notices");
const userRoutes = require("./routes/users");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "VNRVJIET CAMS API",
    description: "Campus Announcement & Management System backend",
    status: "ok",
    docs: "See README.md for endpoint reference.",
  });
});

app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

app.use("/api/auth", authRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`VNRVJIET CAMS API running on http://localhost:${PORT}`);
});
