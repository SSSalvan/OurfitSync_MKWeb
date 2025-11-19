const functions = require("firebase-functions");
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const path = require("path");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2/options");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, 'public')));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// 1. ENDPOINTS: WARDROBE (OUTFITS)
// ==========================================

// GET: Ambil semua item milik user tertentu
app.get("/api/wardrobe", async (req, res) => {
  const userId = req.query.userId; // Frontend akan kirim ?userId=XYZ
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    // Kita sesuaikan nama collection jadi 'wardrobeItems' agar sama dengan logic lama
    const snapshot = await db.collection("wardrobeItems")
      .where("userId", "==", userId)
      .get();
      
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Tambah outfit baru
app.post("/api/wardrobe", async (req, res) => {
  const { type, color, imageUrl, userId, category, isLiked } = req.body;
  
  if (!userId || !imageUrl) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  try {
    const newItem = {
      type: type || category, // Handle penamaan variabel
      category: category || type,
      color: color || "General",
      imageUrl,
      userId,
      isLiked: isLiked || false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("wardrobeItems").add(newItem);
    res.status(201).json({ id: docRef.id, ...newItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. ENDPOINTS: CALENDAR
// ==========================================

app.get("/api/calendar", async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
  
    try {
      const snapshot = await db.collection("calendarEvents")
        .where("userId", "==", userId)
        .get();
        
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});
  
app.post("/api/calendar", async (req, res) => {
    try {
        const docRef = await db.collection("calendarEvents").add(req.body);
        res.status(201).json({ id: docRef.id, message: "Saved to calendar" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 3. ENDPOINTS: USER DATA
// ==========================================

// GET User Profile
app.get("/api/users/:uid", async (req, res) => {
    try {
        const doc = await db.collection("users").doc(req.params.uid).get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });
        res.status(200).json(doc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST/UPDATE User Profile
app.post("/api/users/:uid", async (req, res) => {
    try {
        await db.collection("users").doc(req.params.uid).set(req.body, { merge: true });
        res.status(200).json({ message: "Profile updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

setGlobalOptions({ region: "asia-southeast2" });
exports.api = onRequest(app);