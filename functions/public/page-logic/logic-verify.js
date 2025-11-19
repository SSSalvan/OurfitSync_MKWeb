import { auth } from '../firebase-init.js';
import { sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function initVerifyPage() {
  const currentUser = auth.currentUser;
  if (!currentUser) return; // Seharusnya tidak terjadi

  const verifyEmailText = document.getElementById('verify-email-text');
  if (verifyEmailText) {
    verifyEmailText.textContent = currentUser.email;
  }

  const confirmBtn = document.getElementById('btn-confirm-verify');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        window.loadPage('verified');
      } else {
        alert("Email Anda masih belum terverifikasi. Silakan cek inbox.");
      }
    });
  }

  const resendBtn = document.getElementById('btn-resend-verify');
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      try {
        await sendEmailVerification(currentUser);
        alert("Email verifikasi baru telah dikirim.");
      } catch (error) {
        alert("Gagal mengirim ulang: " + error.message);
      }
    });
  }
}

export function cleanupVerifyPage() {
  // Tidak ada listener
}