// backend/index.js
import app from "./server.js";

// JANGAN gunakan app.listen() untuk Vercel!
// Vercel membutuhkan kita untuk mengekspor aplikasi express sebagai handler.
export default app;