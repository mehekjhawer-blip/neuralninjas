require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

const users = [
  { name: "Admin User", email: "admin@vnrvjiet.in", password: "Admin@123", role: "admin", department: "IT", year: null },
  { name: "Dr. Rao (IT Dept)", email: "faculty.rao@vnrvjiet.in", password: "Faculty@123", role: "faculty", department: "IT", year: null },
  { name: "Mehek", email: "mehek.student@vnrvjiet.in", password: "Student@123", role: "student", department: "IT", year: 2 },
  { name: "Arjun Kumar", email: "arjun.student@vnrvjiet.in", password: "Student@123", role: "student", department: "CSE", year: 3 },
];

console.log("Seeding users...");
const insertUser = db.prepare(
  "INSERT OR IGNORE INTO users (name, email, password_hash, role, department, year) VALUES (?, ?, ?, ?, ?, ?)"
);
for (const u of users) {
  const hash = bcrypt.hashSync(u.password, 10);
  insertUser.run(u.name, u.email, hash, u.role, u.department, u.year);
}

const adminId = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@vnrvjiet.in").id;
const facultyId = db.prepare("SELECT id FROM users WHERE email = ?").get("faculty.rao@vnrvjiet.in").id;

console.log("Seeding notices...");
const notices = [
  {
    title: "Mid-Semester Exam Timetable Released",
    content: "The mid-semester examination timetable for all branches has been published. Check the academics portal for your slot.",
    category: "exam",
    priority: "high",
    target_department: "ALL",
    target_year: null,
    posted_by: facultyId,
  },
  {
    title: "Campus Placement Drive - TCS",
    content: "TCS will be conducting an on-campus placement drive next week. Eligible final year students must register by Friday.",
    category: "placement",
    priority: "high",
    target_department: "ALL",
    target_year: 4,
    posted_by: adminId,
  },
  {
    title: "Robotics Club Weekly Meetup",
    content: "This week's robotics club meetup will cover ROS2 basics. Open to all years, IT and CSE departments.",
    category: "event",
    priority: "normal",
    target_department: "IT",
    target_year: null,
    posted_by: facultyId,
  },
  {
    title: "Library Timings Extended for Exam Week",
    content: "The central library will remain open until 10 PM during the exam week starting next Monday.",
    category: "general",
    priority: "low",
    target_department: "ALL",
    target_year: null,
    posted_by: adminId,
  },
  {
    title: "Urgent: Campus Closed Tomorrow Due to Weather",
    content: "Due to heavy rainfall warnings, the campus will remain closed tomorrow. Online classes will proceed as per the regular timetable.",
    category: "urgent",
    priority: "high",
    target_department: "ALL",
    target_year: null,
    posted_by: adminId,
  },
];

const insertNotice = db.prepare(
  `INSERT INTO notices (title, content, category, priority, target_department, target_year, posted_by)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);
for (const n of notices) {
  insertNotice.run(n.title, n.content, n.category, n.priority, n.target_department, n.target_year, n.posted_by);
}

console.log("Seed complete.");
console.log("\nTest credentials:");
for (const u of users) {
  console.log(`  ${u.role.padEnd(8)} | ${u.email.padEnd(28)} | ${u.password}`);
}
