// ---------------------------------------------------------------
// OutfitSync Backend — Express + Firebase Admin (Node 22 ESM)
// ---------------------------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";

// Load environment variables (optional, but safe)
dotenv.config();

// ---------------------------------------------------------------
// Firebase Admin initialization (Node 22, no JSON assert)
// ---------------------------------------------------------------
const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ---------------------------------------------------------------
// Express app setup
// ---------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5050;

// Basic CORS + JSON body
app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(express.json({ limit: "10mb" }));

// Handle preflight
app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization"
  );
  res.sendStatus(200);
});

// Simple health check
app.get("/", (req, res) => {
  res.send("OutfitSync backend is running.");
});

// ---------------------------------------------------------------
// CALENDAR ROUTES
// ---------------------------------------------------------------

// Create calendar event
// POST /api/calendar
app.post("/api/calendar", async (req, res) => {
  try {
    const docRef = await db.collection("calendarEvents").add(req.body);
    res.status(201).json({
      id: docRef.id,
      message: "Calendar event created",
    });
  } catch (error) {
    console.error("POST /api/calendar error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all events for a user
// GET /api/calendar/user/:uid
app.get("/api/calendar/user/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    const snap = await db
      .collection("calendarEvents")
      .where("userId", "==", uid)
      .get();

    const events = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(events);
  } catch (error) {
    console.error("GET /api/calendar/user/:uid error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update calendar event
// PUT /api/calendar/:id
app.put("/api/calendar/:id", async (req, res) => {
  try {
    await db.collection("calendarEvents").doc(req.params.id).update(req.body);
    res.json({ id: req.params.id, message: "Calendar event updated" });
  } catch (error) {
    console.error("PUT /api/calendar/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete calendar event
// DELETE /api/calendar/:id
app.delete("/api/calendar/:id", async (req, res) => {
  try {
    await db.collection("calendarEvents").doc(req.params.id).delete();
    res.json({ id: req.params.id, message: "Calendar event deleted" });
  } catch (error) {
    console.error("DELETE /api/calendar/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------
// WARDROBE ROUTES
// ---------------------------------------------------------------

// Create wardrobe item
// POST /api/wardrobe
app.post("/api/wardrobe", async (req, res) => {
  try {
    const docRef = await db.collection("wardrobe").add(req.body);
    res.status(201).json({
      id: docRef.id,
      message: "Wardrobe item created",
    });
  } catch (error) {
    console.error("POST /api/wardrobe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get wardrobe items for a user
// GET /api/wardrobe?userId=UID
app.get("/api/wardrobe", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query param" });
    }

    const snap = await db
      .collection("wardrobe")
      .where("userId", "==", userId)
      .get();

    const items = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(items);
  } catch (error) {
    console.error("GET /api/wardrobe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------
// USER PROFILE ROUTES (optional but used by api.js)
// ---------------------------------------------------------------

// Get user profile
// GET /api/users/:uid
app.get("/api/users/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("GET /api/users/:uid error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create/update user profile
// POST /api/users/:uid
app.post("/api/users/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    await db.collection("users").doc(uid).set(req.body, { merge: true });
    res.json({ id: uid, message: "User profile saved" });
  } catch (error) {
    console.error("POST /api/users/:uid error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------
// START SERVER
// ---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 OutfitSync backend running at http://localhost:${PORT}`);
});
