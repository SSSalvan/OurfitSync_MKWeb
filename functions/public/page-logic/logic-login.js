import { auth } from '../firebase-init.js';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { saveUserDataToFirestore } from '../utils/firestore.js';

export function initLoginPage() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        alert("Login Gagal: " + error.message);
      }
    });
  }

  const googleBtn = document.querySelector('.google-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        await saveUserDataToFirestore(result.user, result.user.displayName);
      } catch (error) {
        alert("Google Sign-In Gagal: " + error.message);
      }
    });
  }

  const signupLink = document.getElementById('nav-to-signup');
  if(signupLink) {
    signupLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.loadPage('signup');
    });
  }
}

export function cleanupLoginPage() {
  // Tidak ada listener real-time untuk dihapus
}