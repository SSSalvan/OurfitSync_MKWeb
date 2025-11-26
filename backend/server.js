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

// Firebase Init
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ROUTES
app.post("/wardrobe", async (req, res) => {
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

app.get("/wardrobe", async (req, res) => {
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

export default app;
