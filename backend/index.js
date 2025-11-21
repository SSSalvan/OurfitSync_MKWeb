// ---------------------------------------------------------------
// OutfitSync Backend — Express + Firebase Admin (Node 22 ESM)
// ---------------------------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------
// Environment + Service Account
// ---------------------------------------------------------------
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ---------------------------------------------------------------
// Express Setup
// ---------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// ---------------------------------------------------------------
// Root Health Check
// ---------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("OutfitSync backend is running.");
});

// ---------------------------------------------------------------
// CALENDAR ROUTES
// ---------------------------------------------------------------

// Create event
app.post("/api/calendar", async (req, res) => {
  try {
    const docRef = await db.collection("calendarEvents").add(req.body);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("POST /api/calendar error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all events for user
app.get("/api/calendar/user/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;

    const snap = await db
      .collection("calendarEvents")
      .where("userId", "==", uid)
      .get();

    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(events);
  } catch (error) {
    console.error("GET /api/calendar/user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update event
app.put("/api/calendar/:id", async (req, res) => {
  try {
    await db.collection("calendarEvents").doc(req.params.id).update(req.body);
    res.json({ id: req.params.id });
  } catch (error) {
    console.error("PUT /api/calendar/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete event
app.delete("/api/calendar/:id", async (req, res) => {
  try {
    await db.collection("calendarEvents").doc(req.params.id).delete();
    res.json({ id: req.params.id });
  } catch (error) {
    console.error("DELETE /api/calendar/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------
// WARDROBE ROUTES  — FIXED BASED ON YOUR FIRESTORE STRUCTURE
// ---------------------------------------------------------------
//
// Your Firestore structure:
// wardrobeItems
//   └── <uid>
//         ├── <autoItemId1>
//         ├── <autoItemId2>
//         ├── ...
//
// Each <autoItemId> is an item document.
// ---------------------------------------------------------------

// Create wardrobe item (matching Home's structure)
app.post("/api/wardrobe", async (req, res) => {
  try {
    const docRef = await db.collection("wardrobeItems").add({
      ...req.body,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("POST /api/wardrobe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Load wardrobe items for user (correct structure)
app.get("/api/wardrobe", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query param" });
    }

    const snap = await db
      .collection("wardrobeItems")
      .where("userId", "==", userId)
      .get();

    const items = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ items });
  } catch (error) {
    console.error("GET /api/wardrobe error:", error);
    res.status(500).json({ error: error.message });
  }
});


// ---------------------------------------------------------------
// USER PROFILE (unchanged)
// ---------------------------------------------------------------
app.get("/api/users/:uid", async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("GET /api/users error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users/:uid", async (req, res) => {
  try {
    await db.collection("users").doc(req.params.uid).set(req.body, {
      merge: true,
    });
    res.json({ id: req.params.uid });
  } catch (error) {
    console.error("POST /api/users error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------
// START SERVER
// ---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 OutfitSync backend running at http://localhost:${PORT}`);
});
