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

  try {
    const profileImgRef = ref(storage, `profile_images/${user.uid}.jpg`); 
    const url = await getDownloadURL(profileImgRef);
    const homeAvatar = document.getElementById('home-user-avatar');
    const profileAvatar = document.getElementById('profile-user-avatar');
    if (homeAvatar) homeAvatar.src = url;
    if (profileAvatar) profileAvatar.src = url;
  } catch (error) {
  }
}