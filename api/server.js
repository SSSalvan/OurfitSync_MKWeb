import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// ✅ FIX: CORS dengan whitelist domain yang benar
app.use(
  cors({
    origin: [
      "https://ourfit-sync-mk-web.vercel.app",
      "http://localhost:3000",
      "http://localhost:8000",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:8000",
      "https://outfitsync-web.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Preflight request handler
app.options('*', cors());

// ======================================
// FIREBASE ADMIN INIT
// ======================================
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ======================================
// HEALTH CHECK
// ======================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// ======================================
// WARDROBE ROUTES
// ======================================

// ADD ITEM
app.post("/api/wardrobe", async (req, res) => {
  try {
    const { userId, name, imageUrl, category, color } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const docRef = await db.collection("wardrobe").add({
      userId,
      name,
      imageUrl,
      category,
      color,
      createdAt: new Date(),
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

    const snapshot = await db
      .collection("wardrobe")
      .where("userId", "==", userId)
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(items);
  } catch (err) {
    console.error("Error fetching wardrobe:", err);
    res.status(500).json({ error: "Gagal mengambil data" });
  }
});

// ======================================
// USER PROFILE ROUTES
// ======================================

// GET USER PROFILE
app.get("/api/users/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    
    if (!uid) {
      return res.status(400).json({ error: "uid is required" });
    }

    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      uid: uid,
      ...doc.data()
    });
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

    if (!uid) {
      return res.status(400).json({ error: "uid is required" });
    }

    await db.collection("users").doc(uid).set(data, { merge: true });

    res.json({ message: "Profil berhasil diperbarui" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Gagal update profile" });
  }
});

// ======================================
// CALENDAR ROUTES
// ======================================

// Create Event
app.post("/api/calendar", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const data = req.body;
    const docRef = await db.collection("calendar").add({
      ...data,
      createdAt: new Date(),
    });

    res.json({ id: docRef.id, message: "Event ditambahkan" });
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Gagal tambah event" });
  }
});

// Get all events by user
app.get("/api/calendar/user/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;

    if (!uid) {
      return res.status(400).json({ error: "uid is required" });
    }

    const snapshot = await db
      .collection("calendar")
      .where("userId", "==", uid)
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(events);
  } catch (err) {
    console.error("Error fetching calendar:", err);
    res.status(500).json({ error: "Gagal mengambil event" });
  }
});

// Update event
app.put("/api/calendar/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    const data = req.body;

    if (!eventId) {
      return res.status(400).json({ error: "eventId is required" });
    }

    await db.collection("calendar").doc(eventId).update(data);

    res.json({ message: "Event diperbarui" });
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ error: "Gagal update event" });
  }
});

// Delete event
app.delete("/api/calendar/:id", async (req, res) => {
  try {
    const eventId = req.params.id;

    if (!eventId) {
      return res.status(400).json({ error: "eventId is required" });
    }

    await db.collection("calendar").doc(eventId).delete();

    res.json({ message: "Event dihapus" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: "Gagal hapus event" });
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