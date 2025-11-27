import { storage } from '../firebase-init.js';
import { ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { fetchUserProfile, saveUserProfile } from './api.js'; 

export async function saveUserDataToFirestore(user, name) {
  const existing = await fetchUserProfile(user.uid);
  
  if (!existing) {
    await saveUserProfile(user.uid, {
        name: name || user.displayName,
        email: user.email,
        createdAt: new Date().toISOString()
    });
    console.log("User saved via API");
  }
}

export async function loadUserData(user) {
  if (!user) return;

  // 1. Load Data Teks (Nama, Email, dll)
  try {
    const userData = await fetchUserProfile(user.uid);
    
    if (userData) {
      const elements = {
        'home-user-name': `Hello, ${userData.name || 'User'}!`,
        'profile-user-name': userData.name || 'N/A',
        'profile-user-email': userData.email || user.email,
        'profile-user-gender': userData.gender || 'N/A',
        'profile-user-birthdate': userData.birthDate || 'N/A',
        'profile-user-phone': userData.phoneNumber || 'N/A'
      };
      
      for (const id in elements) {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
      }
    }
  } catch (error) {
    console.error("Error load user API:", error);
  }

  // 2. Load Gambar Profil (Dengan Fallback yang Benar)
  const homeAvatar = document.getElementById('home-user-avatar');
  const profileAvatar = document.getElementById('profile-user-avatar');
  
  // Pastikan file ini ada di folder frontend/images/
  const DEFAULT_AVATAR = './images/avatar.png'; 

  try {
    const profileImgRef = ref(storage, `profile_images/${user.uid}.jpg`); 
    const url = await getDownloadURL(profileImgRef);
    
    // Jika sukses dapat URL dari Storage
    if (homeAvatar) homeAvatar.src = url;
    if (profileAvatar) profileAvatar.src = url;

  } catch (error) {
    // Jika gagal (gambar belum ada di storage), gunakan default lokal
    console.log("Using default avatar (no custom image found).");
    if (homeAvatar) homeAvatar.src = DEFAULT_AVATAR;
    if (profileAvatar) profileAvatar.src = DEFAULT_AVATAR;
  }
}