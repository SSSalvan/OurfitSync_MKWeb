import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

app.use(
  cors({
    origin: "*",
  })
);

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
// WARDROBE ROUTES
// ======================================

// ADD ITEM
app.post("/api/wardrobe", async (req, res) => {
  try {
    const { userId, name, imageUrl, category, color } = req.body;

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
    res.status(500).json({ error: "Gagal menambahkan item" });
  }
});

// GET ALL ITEMS BY USER
app.get("/api/wardrobe", async (req, res) => {
  try {
    const { userId } = req.query;

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
    const doc = await db.collection("users").doc(uid).get();

    if (!doc.exists) return res.status(404).json({ error: "User not found" });

    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil user" });
  }
});

// UPDATE USER PROFILE
app.put("/api/users/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    const data = req.body;

    await db.collection("users").doc(uid).set(data, { merge: true });

    res.json({ message: "Profil berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: "Gagal update profile" });
  }
});

// ======================================
// CALENDAR ROUTES
// ======================================

// Create Event
app.post("/api/calendar", async (req, res) => {
  try {
    const data = req.body;
    const docRef = await db.collection("calendar").add({
      ...data,
      createdAt: new Date(),
    });

    res.json({ id: docRef.id, message: "Event ditambahkan" });
  } catch (err) {
    res.status(500).json({ error: "Gagal tambah event" });
  }
});

// Get all events by user
app.get("/api/calendar/user/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;

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
    res.status(500).json({ error: "Gagal mengambil event" });
  }
});

// Update event
app.put("/api/calendar/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    const data = req.body;

    await db.collection("calendar").doc(eventId).update(data);

    res.json({ message: "Event diperbarui" });
  } catch (err) {
    res.status(500).json({ error: "Gagal update event" });
  }
});

// Delete event
app.delete("/api/calendar/:id", async (req, res) => {
  try {
    const eventId = req.params.id;

    await db.collection("calendar").doc(eventId).delete();

    res.json({ message: "Event dihapus" });
  } catch (err) {
    res.status(500).json({ error: "Gagal hapus event" });
  }
});

export default app;
