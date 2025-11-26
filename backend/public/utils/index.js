// ---------------------------------------------------------------
// OutfitSync Backend — Express + Firebase Admin (Node 22 ESM)
// ---------------------------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
// Path dan fs tidak diperlukan lagi untuk serving statis/root
import path from "path"; 
import { fileURLToPath } from "url"; 
// import fs from "fs"; // Tidak diperlukan lagi

// ---------------------------------------------------------------
// Environment + Service Account Initialization
// ---------------------------------------------------------------
dotenv.config();

// Definisikan __filename dan __dirname di ES Module (masih diperlukan untuk path admin)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

// LOGIC BARU: Menggunakan Environment Variable untuk Vercel
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // 1. Jika di Vercel: Gunakan Environment Variable (JSON String)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin Initialized from Vercel Env.");
    } else {
      // 2. Fallback jika Environment Variable tidak ditemukan
      console.warn("Warning: FIREBASE_SERVICE_ACCOUNT env not found. Running without Admin SDK initialization.");
    }
  } catch (error) {
    console.error("FIREBASE ADMIN INIT ERROR:", error);
  }
}

const db = admin.firestore();

// ---------------------------------------------------------------
// Express Setup & MIDDLEWARE (Hanya untuk API)
// ---------------------------------------------------------------
const app = express();

// --- PERBAIKAN CORS UTAMA ---
const allowedOrigins = [
    "http://127.0.0.1:5500", 
    "http://localhost:5500", 
    "https://ourfit-sync-mk-web.vercel.app" 
];

app.use(cors({ 
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); 
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
    optionsSuccessStatus: 204
}));


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------
// PENTING: MAPPING FILE STATIS DIHAPUS
// ---------------------------------------------------------------
// Baris ini dihapus karena Vercel.json yang melayani:
// app.use(express.static(path.join(__dirname, 'public'))); 


// ---------------------------------------------------------------
// ROOT & HEALTH CHECK DIHAPUS
// ---------------------------------------------------------------
// Route '/' dihapus, karena vercel.json sekarang mengarahkannya ke index.html


// ---------------------------------------------------------------
// WARDROBE ROUTES
// --------------------------------------------------------------
// POST /api/wardrobe: Add new item
app.post("/api/wardrobe", async (req, res) => {
  try {
    const newItem = req.body;
    if (!newItem.userId) {
      return res.status(400).json({ error: "Missing userId in request body" });
    }

    const docRef = await db.collection("wardrobeItems").add({
      ...newItem,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ id: docRef.id, message: "Item added successfully" });
  } catch (error) {
    console.error("POST /api/wardrobe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/wardrobe?userId={userId}: Fetch all items for user
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


// --------------------------------------------------------------
// CALENDAR ROUTES
// --------------------------------------------------------------
// POST /api/calendar: Save new event
app.post("/api/calendar", async (req, res) => {
    try {
        const newEvent = req.body;
        if (!newEvent.userId || !newEvent.date) {
            return res.status(400).json({ error: "Missing userId or date" });
        }
        
        const docRef = await db.collection("calendarEvents").add({
            ...newEvent,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(201).json({ id: docRef.id, message: "Event added successfully" });
    } catch (error) {
        console.error("POST /api/calendar error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/calendar/user/:userId: Fetch all events for a user
app.get("/api/calendar/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const snap = await db
            .collection("calendarEvents")
            .where("userId", "==", userId)
            .get();

        const events = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json({ events });
    } catch (error) {
        console.error("GET /api/calendar/user/:userId error:", error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/calendar/:id: Update an event
app.put("/api/calendar/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        await db.collection("calendarEvents").doc(id).update(updateData);

        res.status(200).json({ id, message: "Event updated successfully" });
    } catch (error) {
        console.error("PUT /api/calendar/:id error:", error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/calendar/:id: Delete an event
app.delete("/api/calendar/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection("calendarEvents").doc(id).delete();
        res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
        console.error("DELETE /api/calendar/:id error:", error);
        res.status(500).json({ error: error.message });
    }
});


// ---------------------------------------------------------------
// USER PROFILE 
// ---------------------------------------------------------------
// GET /api/users/:uid: Fetch user profile
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


// ---------------------------------------------------------------
// Export untuk Vercel
// ---------------------------------------------------------------
export default app;