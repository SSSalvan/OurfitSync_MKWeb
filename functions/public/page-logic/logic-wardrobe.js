import { auth } from '../firebase-init.js';
import { fetchWardrobe } from '../utils/api.js'; // Gunakan API baru
import { renderItemsToContainer } from '../utils/renderer.js';

let allWardrobeItems = []; 
let currentWardrobeFilter = 'all';

function applyWardrobeFilter(category) {
  currentWardrobeFilter = category;
  document.querySelectorAll('#wardrobe-filter-chips .chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.category === category);
  });
  
  const filteredList = (category === 'all' || !category)
    ? allWardrobeItems
    : allWardrobeItems.filter(item => 
        (item.category && item.category.toLowerCase() === category.toLowerCase())
      );
      
  renderItemsToContainer(filteredList, 'wardrobe-grid-container', 'wardrobe-empty-message');
}

async function loadWardrobeData(userId) {
    allWardrobeItems = await fetchWardrobe(userId); // Panggil API Express
    applyWardrobeFilter('all');
}

export function initWardrobePage() {
  const currentUser = auth.currentUser;
  if (currentUser) {
    loadWardrobeData(currentUser.uid);
    
    const chipGroup = document.getElementById('wardrobe-filter-chips');
    if(chipGroup) {
        chipGroup.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip')) {
            applyWardrobeFilter(e.target.dataset.category);
        }
        });
    }
  }
}

export function cleanupWardrobePage() {
  allWardrobeItems = [];
}