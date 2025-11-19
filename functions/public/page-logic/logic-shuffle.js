// File: page-logic/logic-shuffle.js
import { db, auth } from '../firebase-init.js';
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let cleanupFns = [];

/**
 * Helper: render items into a row container
 */
function renderRow(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!items || items.length === 0) {
    // keep row but empty (mockup just looks blank), no text
    return;
  }

  for (const item of items) {
    const wrapper = document.createElement("div");
    wrapper.className = "shuffle-item";

    const img = document.createElement("img");
    img.src =
      item.imageUrl ||
      item.photoURL ||
      item.url ||
      "assets/placeholder.png";
    img.alt = item.name || "Wardrobe item";

    wrapper.appendChild(img);
    container.appendChild(wrapper);
  }
}

/**
 * Load all wardrobe items for current user and split by category
 */
async function loadAndRenderShuffle(uid) {
  const qRef = query(
    collection(db, "wardrobeItems"),
    where("userId", "==", uid)
  );

  try {
    const snapshot = await getDocs(qRef);
    const allItems = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    const norm = (v) => (v || "").toString().toLowerCase();

    const tops = allItems.filter((it) => norm(it.category) === "top");
    const bottoms = allItems.filter((it) => norm(it.category) === "bottom");
    const shoes = allItems.filter((it) => {
      const c = norm(it.category);
      return c === "shoes" || c === "footwear" || c === "shoe";
    });
    const bags = allItems.filter((it) => norm(it.category) === "bag");

    renderRow("tops-row", tops);
    renderRow("bottoms-row", bottoms);
    renderRow("shoes-row", shoes);
    renderRow("bags-row", bags);
  } catch (err) {
    console.error("Failed to load shuffle items:", err);
  }
}

/**
 * Init entrypoint (called from app.js when page = 'shuffle')
 */
export function initShufflePage() {
  const user = auth.currentUser;
  if (!user) return;

  loadAndRenderShuffle(user.uid);

  // Create Outfit → go to shuffle-create page
  const createBtn = document.getElementById("create-outfit-btn");
  if (createBtn) {
    createBtn.addEventListener("click", () => {
      window.dispatchEvent(
        new CustomEvent("navigate", { detail: { page: "create-outfit" } })
      );
    });
  }
}

/**
 * Cleanup when leaving the page
 */
export function cleanupShufflePage() {
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];

  const rows = ["tops-row", "bottoms-row", "shoes-row", "bags-row"];
  rows.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
}
