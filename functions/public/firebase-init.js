// Import fungsi yang kita perlukan dari SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Konfigurasi Firebase Anda (Ini sudah benar)
const firebaseConfig = {
    apiKey: "AIzaSyAb6hYFfPfs06VqWS3v2sHMD035-BOCOl4",
    authDomain: "outfitsync-b8652.firebaseapp.com",
    projectId: "outfitsync-b8652",
    storageBucket: "outfitsync-b8652.firebasestorage.app",
    messagingSenderId: "484280953212",
    appId: "1:484280953212:web:cde3ad0a9eb0105727dcf9",
    measurementId: "G-CKP6CWNCJM"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi dan ekspor service yang akan digunakan di file lain (seperti script.js)
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);