// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("./db");

const app = express();
const PORT = process.env.PORT;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: false }));
app.use(express.json());

/* ---------- Helpers ---------- */

function hashPassword(plain) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plain, salt);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function createResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

/* ---------- Routes ---------- */

// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/**
 * POST /api/auth/register
 * body: { email, password }
 * Simple register endpoint so you can create users.
 */

app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: "Email and password (>= 6 chars) required" });
  }

  const passwordHash = hashPassword(password);

  const sql = "INSERT INTO users (email, password_hash) VALUES (?, ?)";
  db.run(sql, [email.toLowerCase(), passwordHash], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.status(409).json({ error: "Email already registered" });
      }
      console.error("Register error:", err);
      return res.status(500).json({ error: "Internal error" });
    }

    res.json({ id: this.lastID, email });
  });
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.get(sql, [email.toLowerCase()], (err, user) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Internal error" });
    }

    if (!user) {
      // For security, same message as bad password
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Later you can return a JWT; for now simple success
    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email }
    });
  });
});

/**
 * POST /api/auth/forgot-password
 * body: { email }
 *
 * Creates a token, stores it, and logs reset link to console.
 */
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.get(sql, [email.toLowerCase()], (err, user) => {
    if (err) {
      console.error("Forgot-password lookup error:", err);
      return res.status(500).json({ error: "Internal error" });
    }

    // Always respond success to avoid email enumeration
    const genericResponse = {
      message: "If that email is registered, a reset link has been generated."
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const token = createResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const insertSql =
      "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)";
    db.run(insertSql, [user.id, token, expiresAt], function (insertErr) {
      if (insertErr) {
        console.error("Forgot-password insert error:", insertErr);
        return res.status(500).json({ error: "Internal error" });
      }

      // Build reset link (in real app send via email)
      const base = process.env.RESET_LINK_BASE || FRONTEND_ORIGIN + "/reset-password.html";
      const resetLink = `${base}?token=${token}&email=${encodeURIComponent(
        email.toLowerCase()
      )}`;

      console.log("Password reset link (dev only):", resetLink);

      // TODO: send resetLink via email using nodemailer if you want

      return res.json(genericResponse);
    });
  });
});

/**
 * POST /api/auth/reset-password
 * body: { email, token, newPassword }
 */
app.post("/api/auth/reset-password", (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "Email, token and new password (>= 6 chars) are required" });
  }

  const sql = `
    SELECT pr.id as reset_id, pr.expires_at, pr.used, u.id as user_id
    FROM password_resets pr
    JOIN users u ON u.id = pr.user_id
    WHERE pr.token = ? AND u.email = ?
    ORDER BY pr.id DESC
    LIMIT 1
  `;

  db.get(sql, [token, email.toLowerCase()], (err, row) => {
    if (err) {
      console.error("Reset-password lookup error:", err);
      return res.status(500).json({ error: "Internal error" });
    }

    if (!row) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    if (row.used) {
      return res.status(400).json({ error: "This reset link has already been used" });
    }

    const now = new Date();
    const expiresAt = new Date(row.expires_at);
    if (expiresAt < now) {
      return res.status(400).json({ error: "Reset link has expired" });
    }

    // Update password
    const newHash = hashPassword(newPassword);
    const updateUserSql = "UPDATE users SET password_hash = ? WHERE id = ?";
    db.run(updateUserSql, [newHash, row.user_id], function (updateErr) {
      if (updateErr) {
        console.error("Reset-password update user error:", updateErr);
        return res.status(500).json({ error: "Internal error" });
      }

      // Mark token as used
      const markUsedSql = "UPDATE password_resets SET used = 1 WHERE id = ?";
      db.run(markUsedSql, [row.reset_id], function (markErr) {
        if (markErr) {
          console.error("Reset-password mark used error:", markErr);
          // don't fail the response; password is already changed
        }

        res.json({ message: "Password reset successful" });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Auth API running at http://localhost:${PORT}`);
});
