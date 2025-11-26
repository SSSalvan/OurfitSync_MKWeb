// ---------------------------------------------------------------
// OutfitSync Backend — Express + Firebase Admin (Node 22 ESM)
// ---------------------------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url"; // Diperlukan untuk __dirname di ESM

// ---------------------------------------------------------------
// Environment + Service Account
// ---------------------------------------------------------------
dotenv.config();

// Definisikan __dirname di ES Module (Node.js modern)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LOGIC BARU: Menggunakan Environment Variable untuk Vercel
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // 1. Jika di Vercel: Gunakan Environment Variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin Initialized from Vercel Env.");
    } else {
      // 2. Fallback jika Environment Variable tidak ditemukan
      console.warn("Warning: FIREBASE_SERVICE_ACCOUNT env not found. Running without Admin SDK initialization.");
      
      // Jika Anda ingin mencoba menjalankan API lokal tanpa Service Account Key,
      // Anda bisa menghapus atau mengomentari baris di atas, tapi ini berbahaya
      // karena API membutuhkan akses Firestore. Untuk deploy di Vercel, pastikan Env Var terisi.
    }
  } catch (error) {
    console.error("Firebase admin initialization error during JSON parse or startup:", error.message);
    // Jika JSON.parse gagal, ini akan mencatat error 500 dan crash.
    // Pastikan JSON yang di-paste di Vercel benar-benar murni JSON string.
    
    // Melempar error agar Vercel mencatat crash dengan jelas
    throw new Error("Failed to initialize Firebase Admin SDK. Check FIREBASE_SERVICE_ACCOUNT variable.");
  }
}

const db = admin.firestore();

// ---------------------------------------------------------------
// Express Setup
// ---------------------------------------------------------------
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));


// --- PENTING: STATIC FILE SERVING UNTUK FRONTEND ---
// Ini memungkinkan Vercel menyajikan file dari folder public/
// Folder public harus berada di dalam folder backend/ (Root Directory Vercel)
app.use(express.static(path.join(__dirname, 'public')));


// ---------------------------------------------------------------
// Root & Health Check (Mengembalikan index.html atau Pesan Teks)
// ---------------------------------------------------------------

app.get("/", (req, res) => {
    // Coba kirim index.html jika ada (jika frontend di-host bersama)
    // Jika folder public Anda berisi index.html, ini akan menampilkannya.
    const indexPath = path.join(__dirname, 'public', 'index.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Jika tidak ada index.html, kirim pesan teks
        res.send("OutfitSync backend is running on Vercel. Frontend files not found at root.");
    }
});


// ---------------------------------------------------------------
// CALENDAR ROUTES (Tetap sama)
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
// WARDROBE ROUTES (Tetap sama)
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
// USER PROFILE (Tetap sama)
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

export default app;