import { auth, db, storage } from '../firebase-init.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

export function initEditProfilePage() {
  const currentUser = auth.currentUser;
  
  // Muat script non-module (editprl.js Anda)
  // Perlu path '../' karena file ini ada di dalam 'page-logic'
  const script = document.createElement('script');
  script.src = 'pages/edit-profile.js'; 
  script.id = 'page-script';
  document.body.appendChild(script);

  const backBtn = document.getElementById('nav-to-profile');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.loadPage('profile'); 
    });
  }

  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!currentUser) return alert("Anda tidak login!");
      
      const userDocRef = doc(db, "users", currentUser.uid);

      // 1. Kumpulkan data Teks
      const updatedProfile = {
        name: document.getElementById('name').value,
        gender: document.getElementById('gender').value,
        birthDate: document.getElementById('birth').value,
        email: document.getElementById('email').value,
        phoneNumber: document.getElementById('phone').value 
      };

      // 2. Kumpulkan data Gambar
      const fileInput = document.getElementById('avatarInput');
      const file = fileInput.files[0];

      try {
        alert("Menyimpan...");

        // 3. Jika ada file, upload ke Storage
        if (file) {
          const storageRef = ref(storage, `profile_images/${currentUser.uid}.jpg`);
          await uploadBytes(storageRef, file);
          console.log('Gambar profil berhasil di-upload ke Storage');
        }

        // 4. Update data teks di Firestore
        await updateDoc(userDocRef, updatedProfile);
        console.log('Data profil berhasil di-update di Firestore');

        alert("Profil berhasil disimpan!");
        window.loadPage('profile'); 

      } catch (error) {
        console.error("Gagal menyimpan profil:", error);
        alert("Gagal menyimpan profil: " + error.message);
      }
    });
  }
}

export function cleanupEditProfilePage() {
  // Hapus script non-module yang kita muat
  const pageScript = document.getElementById('page-script');
  if (pageScript) {
    pageScript.remove();
  }
}