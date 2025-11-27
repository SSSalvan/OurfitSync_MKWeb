import { storage } from '../firebase-init.js';
import { ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { fetchUserProfile, saveUserProfile } from './api.js'; 

// Helper cepat untuk update text HTML
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export async function saveUserDataToFirestore(user, name) {
  // Cek apakah user sudah ada di DB via API
  const existing = await fetchUserProfile(user.uid);
  
  // Jika existing.notFound (flag dari backend) atau error
  if (!existing || existing.notFound) {
    await saveUserProfile(user.uid, {
        name: name || user.displayName || "User",
        email: user.email,
        createdAt: new Date().toISOString()
    });
    console.log("User baru disimpan via API");
  }
}

export async function loadUserData(user) {
  if (!user) return;

  // 1. TAMPILKAN DATA INSTAN DARI AUTH (Biar Gak Stuck Loading)
  const displayName = user.displayName || "Friend";
  setText('home-user-name', `Hello, ${displayName}`);
  setText('profile-user-name', displayName);
  setText('profile-user-email', user.email);

  // 2. FETCH DATA LENGKAP DARI API
  try {
    const userData = await fetchUserProfile(user.uid);
    
    if (userData && !userData.error) {
      // Jika ada data lebih lengkap di DB, timpa data Auth tadi
      const realName = userData.name || displayName;
      
      setText('home-user-name', `Hello, ${realName}!`);
      setText('profile-user-name', realName);
      setText('profile-user-gender', userData.gender || '-');
      setText('profile-user-birthdate', userData.birthDate || '-');
      setText('profile-user-phone', userData.phoneNumber || '-');

      // 3. HANDLE AVATAR (Paling Penting)
      await handleAvatar(user.uid, userData.profileImageUrl);
    } 
  } catch (error) {
    console.error("Gagal load API user, tetap menggunakan data Auth:", error);
    // UI sudah terisi di langkah 1, jadi aman.
    // Fallback avatar tetap jalan
    await handleAvatar(user.uid, null);
  }
}

async function handleAvatar(uid, apiImageUrl) {
  const homeAvatar = document.getElementById('home-user-avatar');
  const profileAvatar = document.getElementById('profile-user-avatar');

  // URL Fallback Aman (UI Avatars) -> Tidak akan 404
  const fallbackUrl = `https://ui-avatars.com/api/?name=User&background=random&color=fff`;

  // A. Jika ada URL dari Database -> Pakai
  if (apiImageUrl) {
    if (homeAvatar) homeAvatar.src = apiImageUrl;
    if (profileAvatar) profileAvatar.src = apiImageUrl;
    return;
  }

  // B. Jika tidak, Cek Firebase Storage (Siapa tau ada file manual)
  try {
    const profileImgRef = ref(storage, `profile_images/${uid}.jpg`); 
    const url = await getDownloadURL(profileImgRef);
    if (homeAvatar) homeAvatar.src = url;
    if (profileAvatar) profileAvatar.src = url;
  } catch (err) {
    // C. Jika semua gagal, pakai UI Avatars (Jangan pakai file lokal ./images/avatar.png yg bikin error)
    if (homeAvatar && (!homeAvatar.src || homeAvatar.src.includes('avatar.png'))) {
        homeAvatar.src = fallbackUrl;
    }
    if (profileAvatar && (!profileAvatar.src || profileAvatar.src.includes('avatar.png'))) {
        profileAvatar.src = fallbackUrl;
    }
  }
}