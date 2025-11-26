// Nama file: script.js
// ===== SCRIPT.JS - Universal Script untuk Semua Page =====

// 1. Impor service dari file konfigurasi kita
import { db, auth, storage } from './firebase-config.js';

// 2. Impor fungsi-fungsi yang kita butuhkan dari SDK
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ----- INJECT TOP LEFT BUTTON (KODE ANDA - SUDAH BENAR) -----
function injectTopLeftButton() {
  if (document.querySelector(".top-left")) return;
  const topLeftHTML = `
    <div class="top-left">
      <button class="logo-btn" id="menu-btn">
        <img src="images/logo-small.png" alt="OutfitSync small logo" class="logo-small"/>
        <img src="assets/arrow.png" alt="Arrow icon" class="arrow-icon" />
      </button>
      <div class="dropdown-menu" id="dropdown-menu">
        <button id="profile-btn"><img src="assets/profile-icon.png" alt="Profile" /></button>
        <button id="shuffle-btn"><img src="assets/shuffle-icon.png" alt="Shuffle" /></button>
        <button id="add-btn"><img src="assets/add-icon.png" alt="Add" /></button>
        <button id="home-btn"><img src="assets/home-icon.png" alt="Home" /></button>
        <button id="wardrobe-btn"><img src="assets/wardrobe-icon.png" alt="Wardrobe" /></button>
        <button id="calendar-btn"><img src="assets/calendar-icon.png" alt="Calendar" /></button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("afterbegin", topLeftHTML);
  initDropdown();
  initNavigation();
}

// ----- DROPDOWN FUNCTIONALITY (KODE ANDA - SUDAH BENAR) -----
function initDropdown() {
  const menuBtn = document.getElementById("menu-btn");
  const dropdownMenu = document.getElementById("dropdown-menu");
  if (menuBtn && dropdownMenu) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
      menuBtn.classList.toggle("active");
    });
    document.addEventListener("click", (e) => {
      if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove("show");
        menuBtn.classList.remove("active");
      }
    });
  }
}

// ----- NAVIGATION FUNCTIONALITY (KODE ANDA - SUDAH BENAR) -----
function initNavigation() {
  document.getElementById("profile-btn")?.addEventListener("click", () => window.location.href = "profile-page.html");
  document.getElementById("shuffle-btn")?.addEventListener("click", () => window.location.href = "shuffle-page.html");
  document.getElementById("add-btn")?.addEventListener("click", () => window.location.href = "add-page.html");
  document.getElementById("home-btn")?.addEventListener("click", () => window.location.href = "home-page.html");
  document.getElementById("wardrobe-btn")?.addEventListener("click", () => window.location.href = "wardrobe-page.html");
  document.getElementById("calendar-btn")?.addEventListener("click", () => window.location.href = "calendar-page.html");
}

// ----- AUTO INJECT & INIT (KODE ANDA - SUDAH BENAR) -----
document.addEventListener("DOMContentLoaded", () => {
  const needsButton = document.querySelector(
    ".home-page, .profile-page, .wardrobe-page, .calendar-page, .shuffle-page, .add-page"
  );
  if (needsButton) {
    injectTopLeftButton();
    document.body.style.overflow = "auto";
  }
  if (document.querySelector(".date")) {
    updateDateTime();
  }
});



// ========== FIREBASE AUTH & LOGIC ==========
// Ini menggantikan bagian '// ========== INDEX.HTML SPECIFIC CODE =========='

// --- ELEMEN HALAMAN (dari kode Anda) ---
const landingPage = document.getElementById('landing');
const loginPage = document.getElementById('login-page');
const signupPage = document.getElementById('signup-page');
const verifyPage = document.getElementById("verify-page");
const verifiedPage = document.getElementById("verified-page");
const mainLanding = document.getElementById("main-landing");
const signUpLink = document.querySelector(".login-page .signup-text a");
const signInLink = document.getElementById("signin-link");
// PENTING: Pastikan index.html Anda punya id="login-form" dan id="signup-form"
const loginForm = document.getElementById("login-form"); 
const signupForm = document.getElementById("signup-form");

// --- LOGIKA UTAMA: PENGECEKAN STATUS LOGIN ---
onAuthStateChanged(auth, (user) => {
  const currentPage = window.location.pathname;

  if (user) {
    // --- PENGGUNA SUDAH LOGIN ---
    console.log("Pengguna login:", user.uid);
    
    if (currentPage.includes("index.html") || currentPage === "/") {
      if (loginPage) loginPage.classList.add('hidden');
      if (signupPage) signupPage.classList.add('hidden');
      if (mainLanding) mainLanding.classList.remove('hidden');
      
      setTimeout(() => {
        console.log("Mengarahkan ke home-page.html...");
        window.location.href = 'home-page.html';
      }, 2000); 
    } else if (currentPage.includes("home-page.html")) {
      // INI ADALAH LOGIKA UNTUK HOME-PAGE.HTML
      fetchUserData(user);
      setupLogoutButton(); 
    }

  } else {
    // --- PENGGUNA TIDAK LOGIN ---
    console.log("Pengguna tidak login.");

    if (!currentPage.includes("index.html") && currentPage !== "/") {
      console.log("Mengarahkan ke index.html...");
      window.location.href = 'index.html';
    } else {
      setTimeout(() => {
        if (landingPage) {
          landingPage.classList.add("fade-out");
          setTimeout(() => {
            landingPage.style.display = "none";
            if (loginPage) {
              loginPage.classList.remove("hidden");
              loginPage.classList.add("fade-in");
            }
          }, 1000);
        }
      }, 500);
    }
  }
});

// --- FUNGSI-FUNGSI KHUSUS HALAMAN ---

// Cek apakah kita di index.html
if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
    
    // Navigasi Pindah Halaman Login/Sign Up (dari kode Anda)
    if (signUpLink) {
      signUpLink.addEventListener("click", (e) => {
        e.preventDefault();
        loginPage.classList.add("hidden");
        signupPage.classList.remove("hidden");
        signupPage.classList.add("fade-in");
      });
    }
    if (signInLink) {
      signInLink.addEventListener("click", (e) => {
        e.preventDefault();
        signupPage.classList.add("hidden");
        loginPage.classList.remove("hidden");
        loginPage.classList.add("fade-in");
      });
    }

    // --- FORM LOGIN (FIREBASE-POWERED) ---
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        if (!email || !password) return alert("Email dan password harus diisi");

        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          console.log("Login berhasil:", userCredential.user);
          // onAuthStateChanged akan otomatis mengurus redirect
        } catch (error) {
          console.error("Error saat login:", error.message);
          alert("Login gagal: " + error.code);
        }
      });
    }

    // --- FORM SIGN UP (FIREBASE-POWERED) ---
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        if (!name || !email || !password) return alert("Nama, email, dan password harus diisi");

        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          console.log("Sign up berhasil:", user);

          // Simpan nama ke Firestore
          await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            createdAt: new Date()
          });
          console.log("Data user disimpan ke Firestore");
          
          await sendEmailVerification(user);
          alert("Akun dibuat! Silakan cek email Anda untuk verifikasi.");

          if(signupPage) signupPage.classList.add('hidden');
          if(verifyPage) verifyPage.classList.remove('hidden');

        } catch (error) {
          console.error("Error saat sign up:", error.message);
          alert("Sign up gagal: " + error.code);
        }
      });
    }

    // --- VERIFY & VERIFIED PAGE LOGIC (dari kode Anda) ---
    const confirmBtn = document.querySelector(".verify-page .btn-main");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if(verifyPage) verifyPage.classList.add("hidden");
        if(verifiedPage) verifiedPage.classList.remove("hidden");
      });
    }
    const doneBtn = document.querySelector(".verified-page .btn-main");
    if (doneBtn) {
      doneBtn.addEventListener("click", () => {
        if(verifiedPage) verifiedPage.classList.add("hidden");
        if(loginPage) loginPage.classList.remove("hidden"); // Kembali ke login
      });
    }

    // --- RESEND CODE FUNCTIONALITY (dari kode Anda + Firebase) ---
    const resendLink = document.querySelector(".resend-text a");
    if (resendLink) {
      resendLink.addEventListener("click", async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user) {
          try {
            await sendEmailVerification(user);
            alert("Email verifikasi baru telah dikirim!");
          } catch (error) {
            alert("Gagal mengirim ulang: " + error.message);
          }
        } else {
          alert("Anda harus sign up terlebih dahulu.");
        }
        
        resendLink.textContent = "Code sent!";
        resendLink.style.pointerEvents = "none";
        // ... (sisa logika countdown Anda) ...
      });
    }
}

// Cek apakah kita di home-page.html
if (window.location.pathname.includes("home-page.html")) {
    
    // INI ADALAH FUNGSI YANG ANDA TANYAKAN
    async function fetchUserData(user) {
        if (!user) return;
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log("Data user:", userData);
            
            const greetingElement = document.querySelector(".greeting .user-info h2");
            if (greetingElement) {
                greetingElement.textContent = `Hello, ${userData.name}!`;
            }
            
            const profileImg = document.querySelector(".greeting .user-info .profile-img");
            if (profileImg && userData.profileImageUrl) {
                profileImg.src = userData.profileImageUrl;
            } else if (profileImg) {
                profileImg.src = 'assets/profile.png'; // Fallback
            }
        } else {
            console.log("Tidak ada data user di Firestore!");
            const greetingElement = document.querySelector(".greeting .user-info h2");
            if (greetingElement) {
                greetingElement.textContent = `Hello, Welcome!`;
            }
        }
    }

    // Fungsi untuk menambah tombol logout di dropdown
    function setupLogoutButton() {
        const dropdownMenu = document.getElementById("dropdown-menu");
        if (dropdownMenu && !document.getElementById("logout-btn")) {
            const logoutButton = document.createElement('button');
            logoutButton.id = "logout-btn";
            logoutButton.innerHTML = `<img src="assets/add-icon.png" alt="Logout" style="transform: rotate(45deg); filter: invert(20%);">`; 
            
            logoutButton.addEventListener('click', async () => {
                try {
                    await signOut(auth);
                    // onAuthStateChanged akan urus redirect ke index.html
                } catch (error) {
                    console.error('Error logout:', error);
                }
            });
            dropdownMenu.appendChild(logoutButton);
        }
    }
}