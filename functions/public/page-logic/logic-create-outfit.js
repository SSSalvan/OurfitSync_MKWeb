// File: page-logic/logic-create-outfit.js

import { db, auth } from '../firebase-init.js';
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let cleanupFns = [];

/* ---------- RENDERING & SELECTION ---------- */

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

    wrapper.appendChild(img);
    strip.appendChild(wrapper);

    // click to select
    const clickHandler = () => setActiveItem(strip, wrapper);
    wrapper.addEventListener('click', clickHandler);
    cleanupFns.push(() => wrapper.removeEventListener('click', clickHandler));

    // default: first item selected
    if (index === 0) {
      wrapper.classList.add('is-active');
    }
  });
}

// Get selected item in a strip
function getSelectedItem(strip) {
  return strip.querySelector('.co-item.is-active');
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

    const selected = getSelectedItem(strip);
    if (!selected) continue;

    const img = selected.querySelector('img');
    result[category] = {
      imageUrl: img?.src || null,
      alt: img?.alt || ''
    };
  }

  return result;
}

/* ---------- FIRESTORE LOAD ---------- */

async function loadCreateData(uid) {
  const qRef = query(
    collection(db, 'wardrobeItems'),
    where('userId', '==', uid)
  );

  const snapshot = await getDocs(qRef);
  const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  const cat = v => (v || '').toLowerCase();

  const tops = all.filter(i => cat(i.category) === 'top');
  const bottoms = all.filter(i => cat(i.category) === 'bottom');
  const shoes = all.filter(i =>
    ['shoe', 'shoes', 'footwear'].includes(cat(i.category))
  );
  const bags = all.filter(i => cat(i.category) === 'bag');

  renderStrip('co-tops-strip', tops);
  renderStrip('co-bottoms-strip', bottoms);
  renderStrip('co-shoes-strip', shoes);
  renderStrip('co-bags-strip', bags);
}

function shuffleAllStrips() {
  const stripIds = [
    'co-tops-strip',
    'co-bottoms-strip',
    'co-shoes-strip',
    'co-bags-strip'
  ];

  stripIds.forEach(id => {
    const strip = document.getElementById(id);
    if (!strip) return;

    const items = strip.querySelectorAll('.co-item');
    if (items.length <= 1) return;  // nothing to shuffle

    const active = strip.querySelector('.co-item.is-active');
    const activeIndex = [...items].indexOf(active);

    let randomIndex = activeIndex;

    // pick a different index
    while (randomIndex === activeIndex) {
      randomIndex = Math.floor(Math.random() * items.length);
    }

    const randomItem = items[randomIndex];

    // Select the new one
    setActiveItem(strip, randomItem);

    // scroll into view
    randomItem.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  });
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
      );x
    };
    createBtn.addEventListener('click', createHandler);
    cleanupFns.push(() => createBtn.removeEventListener('click', createHandler));
  }
}

export function cleanupCreateOutfitPage() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
}
