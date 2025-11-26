// File: page-logic/logic-create-outfit.js

import { auth } from '../firebase-init.js';
// DIUBAH: Menghapus import Firestore, menambahkan import api.js
import { fetchWardrobe } from '../utils/api.js'; 

let cleanupFns = [];
// Make one item active inside its strip
function setActiveItem(strip, item) {
  const items = strip.querySelectorAll('.co-item');
  items.forEach(i => i.classList.remove('is-active'));
  if (item) item.classList.add('is-active');
}

// Render one category row
function renderStrip(stripId, items) {
  const strip = document.getElementById(stripId);
  if (!strip) return;

  strip.innerHTML = "";

  items.forEach((itemData, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'co-item';

    const img = document.createElement('img');
    img.src =
      itemData.imageUrl ||
      itemData.url ||
      itemData.photoURL ||
      'assets/placeholder.png';
    img.alt = itemData.name || 'Wardrobe item';
    
    // Store data in dataset for easy retrieval later
    wrapper.dataset.item = JSON.stringify(itemData);

    wrapper.appendChild(img);
    strip.appendChild(wrapper);

    // click to select
    const handler = () => setActiveItem(strip, wrapper);
    wrapper.addEventListener('click', handler);
    cleanupFns.push(() => wrapper.removeEventListener('click', handler));
  });

  // Automatically select the first item if present
  const firstItem = strip.querySelector('.co-item');
  if (firstItem) setActiveItem(strip, firstItem);
}

// Shuffle items in a strip
function shuffleStrip(stripId) {
    const strip = document.getElementById(stripId);
    if (!strip) return;
    const items = [...strip.querySelectorAll('.co-item')];
    if (items.length <= 1) return;

    let currentIndex = 0;
    // Find the currently active item
    const activeItem = strip.querySelector('.co-item.is-active');
    if (activeItem) {
        currentIndex = items.indexOf(activeItem);
    }
    
    // Calculate the next index, wrapping around
    let nextIndex = (currentIndex + 1) % items.length;
    
    // Set the new active item
    setActiveItem(strip, items[nextIndex]);
}

function shuffleAllStrips() {
  const stripIds = [
    'co-tops-strip',
    'co-bottoms-strip',
    'co-shoes-strip',
    'co-bags-strip'
  ];

  stripIds.forEach(id => {
      shuffleStrip(id);
  });
}

// Collect the current outfit selection from all strips
function collectCurrentSelection() {
  const stripIds = {
    top: 'co-tops-strip',
    bottom: 'co-bottoms-strip',
    shoes: 'co-shoes-strip',
    bag: 'co-bags-strip'
  };

  const result = {};

  for (const [category, stripId] of Object.entries(stripIds)) {
    const strip = document.getElementById(stripId);
    if (!strip) continue;

    const selected = strip.querySelector('.co-item.is-active');
    if (!selected || !selected.dataset.item) continue;

    try {
        // Ambil data item yang sudah disimpan di dataset
        result[category] = JSON.parse(selected.dataset.item);
    } catch(e) {
        console.error(`Failed to parse item data for ${category}`, e);
    }
  }

  return result;
}

/* ---------- DATA LOADING (MENGGUNAKAN API.JS) ---------- */

async function loadCreateData(uid) {
  try {
    const allItems = await fetchWardrobe(uid); // <-- Menggunakan fungsi API

    const cat = v => (v || '').toLowerCase();

    const tops = allItems.filter(i => cat(i.category) === 'top');
    const bottoms = allItems.filter(i => cat(i.category) === 'bottom');
    const shoes = allItems.filter(i =>
      ['shoe', 'shoes', 'footwear'].includes(cat(i.category))
    );
    const bags = allItems.filter(i => cat(i.category) === 'bag');

    renderStrip('co-tops-strip', tops);
    renderStrip('co-bottoms-strip', bottoms);
    renderStrip('co-shoes-strip', shoes);
    renderStrip('co-bags-strip', bags);

  } catch (error) {
    console.error("Error loading wardrobe data:", error);
    // Tampilkan pesan error jika gagal
    alert("Failed to load wardrobe data from API.");
  }
}


/* ---------- INIT / CLEANUP ---------- */

export function initCreateOutfitPage() {
  const root = document.getElementById('create-outfit-page');
  if (!root) return;

  const user = auth.currentUser;
  if (!user) return;

  loadCreateData(user.uid);

 // Back → shuffle page
  const backBtn = document.querySelector('.backBtn');
  if (backBtn) {
    const handler = () => {
      window.dispatchEvent(
        new CustomEvent('navigate', { detail: { page: 'shuffle' } })
      );
    };
    backBtn.addEventListener('click', handler);
    cleanupFns.push(() => backBtn.removeEventListener('click', handler));
  }

  // Shuffle
  const shuffleBtn = document.getElementById('co-shuffle-btn');
  if (shuffleBtn) {
    const shuffleHandler = () => shuffleAllStrips();
    shuffleBtn.addEventListener('click', shuffleHandler);
    cleanupFns.push(() => shuffleBtn.removeEventListener('click', shuffleHandler));
  }

  // Create outfit → store selection & go to summary page
  const createBtn = document.getElementById('co-create-btn');
  if (createBtn) {
    const createHandler = () => {
      const selection = collectCurrentSelection();
      sessionStorage.setItem(
        'currentOutfitSelection',
        JSON.stringify(selection)
      );
      window.dispatchEvent(
        new CustomEvent('navigate', { detail: { page: 'outfit-summary' } })
      );
    };
    createBtn.addEventListener('click', createHandler);
    cleanupFns.push(() => createBtn.removeEventListener('click', createHandler));
  }
}

export function cleanupCreateOutfitPage() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
}