const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "*" })); // for learning; later restrict to your frontend URL
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend ✅", time: new Date().toISOString() });
});

// Create note
app.post("/api/notes", (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "text required" });

  db.run("INSERT INTO notes(text) VALUES (?)", [text.trim()], function (err) {
    if (err) return res.status(500).json({ error: "db insert failed" });
    res.json({ id: this.lastID, text: text.trim() });
  });
});

// List notes
app.get("/api/notes", (req, res) => {
  db.all("SELECT * FROM notes ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "db read failed" });
    res.json(rows);
  });
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
