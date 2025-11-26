import { auth } from "../firebase-init.js";
import { fetchWardrobe } from "../utils/api.js"; // <-- DIUBAH

let allWardrobeItems = [];
let cleanupFns = [];

// ======================================================
// FETCH WARDROBE DARI API.JS
// ======================================================
async function fetchWardrobeApi(userId) {
  // Menggunakan fungsi dari api.js
  return await fetchWardrobe(userId); 
}

// ======================================================
// RENDER WARDROBE GRID
// ======================================================
function renderItems(items) {
  const grid = document.getElementById("wardrobe-grid-container");
  const emptyMsg = document.getElementById("wardrobe-empty-message");

  if (!grid) return;
  grid.innerHTML = "";

  if (!items.length) {
    emptyMsg.style.display = "block";
    return;
  }

  emptyMsg.style.display = "none";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";

    card.innerHTML = `
      <img src="${item.imageUrl || item.url}" class="wardrobe-thumb" />

      <button class="like-btn ${item.isLiked ? "liked" : ""}">
        <svg viewBox="0 0 24 24">
          <path d="M12 21s-6.7-4.5-9.5-8.3C.8 10.3 1 7.3 3 5.5c2-1.8 5-1.2 6.6.7L12 8.8l2.4-2.6c1.6-1.9 4.6-2.5 6.6-.7 2 1.8 2.2 4.8.5 7.2C18.7 16.5 12 21 12 21z"/>
        </svg>
      </button>
    `;

    grid.appendChild(card);
  });
}

// ======================================================
// FILTERING LOGIC
// ======================================================
function applyFilter(category) {
  document.querySelectorAll("#wardrobe-filter-chips .chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.category === category);
  });

  const filtered =
    category === "all"
      ? allWardrobeItems
      : allWardrobeItems.filter(
          (item) => item.category?.toLowerCase() === category.toLowerCase()
        );

  renderItems(filtered);
}

// ======================================================
// LOAD WARDROBE ITEMS
// ======================================================
async function loadWardrobe(userId) {
  try {
    allWardrobeItems = await fetchWardrobeApi(userId); // <-- DIUBAH
    applyFilter("all");
  } catch (err) {
    console.error("Wardrobe load error:", err);
    allWardrobeItems = [];
    applyFilter("all");
  }
}

// ======================================================
// PAGE INIT
// ======================================================
export function initWardrobePage() {
  const user = auth.currentUser;
  if (!user) return;

  loadWardrobe(user.uid);

  const chipGroup = document.getElementById("wardrobe-filter-chips");
  if (chipGroup) {
    const chipHandler = (e) => {
      if (e.target.classList.contains("chip")) {
        applyFilter(e.target.dataset.category);
      }
    };

    chipGroup.addEventListener("click", chipHandler);
    cleanupFns.push(() => chipGroup.removeEventListener("click", chipHandler));
  }
}

// ======================================================
// CLEANUP WHEN LEAVING PAGE
// ======================================================
export function cleanupWardrobePage() {
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];
  allWardrobeItems = [];
}