import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// ✅ FIX: CORS Configuration
app.use(
  cors({
    origin: [
      "https://ourfit-sync-mk-web.vercel.app", // Domain Backend (Opsional)
      "https://outfitsync-web.vercel.app",     // Domain Frontend Utama
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5500",                 // Live Server VSCode
      "http://127.0.0.1:5500"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ======================================
// FIREBASE ADMIN INIT
// ======================================
if (!admin.apps.length) {
  // Pastikan Environment Variable FIREBASE_SERVICE_ACCOUNT ada di Vercel
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error("Firebase Init Error: Invalid JSON", error);
    }
  } else {
    console.error("Firebase Init Error: FIREBASE_SERVICE_ACCOUNT missing");
  }
}

const db = admin.firestore();

// ======================================
// HEALTH CHECK
// ======================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// ======================================
// WARDROBE ROUTES (Updated to 'wardrobeItems')
// ======================================

// ADD ITEM
app.post("/api/wardrobe", async (req, res) => {
  try {
    const { userId, name, imageUrl, category, color } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // ✅ SINKRONISASI: Menggunakan 'wardrobeItems' sesuai Android App
    const docRef = await db.collection("wardrobeItems").add({
      userId,
      name,
      imageUrl,
      category,
      color,
      createdAt: new Date(),
      isLiked: false // Default value
    });

    res.json({ id: docRef.id, message: "Item berhasil ditambahkan" });
  } catch (err) {
    console.error("Error adding wardrobe item:", err);
    res.status(500).json({ error: "Gagal menambahkan item" });
  }
});

// GET ALL ITEMS BY USER
app.get("/api/wardrobe", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // ✅ SINKRONISASI: Menggunakan 'wardrobeItems' sesuai Android App
    const snapshot = await db
      .collection("wardrobeItems")
      .where("userId", "==", userId)
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(items);
  } catch (err) {
    console.error("Error fetching wardrobe:", err);
    // Detail error hanya di console log server, jangan kirim detail ke client
    res.status(500).json({ error: "Gagal mengambil data dari database" });
  }
});

// ======================================
// USER PROFILE ROUTES
// ======================================

// GET USER PROFILE
app.get("/api/users/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    
    if (!uid) return res.status(400).json({ error: "uid is required" });

    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ uid: uid, ...doc.data() });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Gagal mengambil user" });
  }
});

// UPDATE USER PROFILE
app.put("/api/users/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    const data = req.body;

    if (!uid) return res.status(400).json({ error: "uid is required" });

    await db.collection("users").doc(uid).set(data, { merge: true });

    res.json({ message: "Profil berhasil diperbarui" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Gagal update profile" });
  }
});

// ======================================
// ERROR HANDLER
// ======================================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;