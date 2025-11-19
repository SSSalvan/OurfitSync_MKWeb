import { auth } from '../firebase-init.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function initProfilePage() {
  const editBtn = document.getElementById('nav-to-edit-profile');
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.loadPage('edit-profile');
    });
  }

  const logoutBtn = document.getElementById('logout-button');
  if(logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await signOut(auth);
    });
  }
}

export function cleanupProfilePage() {
  // Tidak ada listener
}