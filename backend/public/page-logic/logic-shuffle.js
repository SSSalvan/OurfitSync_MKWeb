
import { auth } from '../firebase-init.js';
import { fetchWardrobe } from '../utils/api.js'; 

let cleanupFns = [];

function renderRow(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!items || items.length === 0) {
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
 * Load all wardrobe items for current user from API and split by category
 */
async function loadAndRenderShuffle(uid) {
  try {
    const allItems = await fetchWardrobe(uid); // <-- DIUBAH: Menggunakan fungsi API

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
    console.error("Failed to load shuffle items from API:", err);
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
    const handler = () => {
        window.dispatchEvent(
          new CustomEvent("navigate", { detail: { page: "create-outfit" } })
        );
    };
    createBtn.addEventListener("click", handler);
    cleanupFns.push(() => createBtn.removeEventListener("click", handler));
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