// File: logic-add-page.js
// Add Outfit page logic – minimal fixes, same behavior

import { auth, storage } from "../firebase-init.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { addWardrobeItem } from "../utils/api.js";

let outfitData = {};
let fileInput = null;

// Keep references so we can clean them up
let handleUploadTrigger = null;
let fileInputChangeHandler = null;
let saveClickHandler = null;
let nextStepHandlers = [];
let backStepHandlers = [];

// Helper navigasi antar step
function goToStep(stepId) {
  document
    .querySelectorAll(".outfit-step")
    .forEach((el) => el.classList.remove("active"));
  const target = document.getElementById(stepId);
  if (target) target.classList.add("active");
}

export const initAddPagePage = () => {
  const currentUser = auth.currentUser;

  // Tombol-tombol utama
  const triggerUploadBtn = document.getElementById("upload-btn-trigger");
  const iconUploadArea = document.getElementById("trigger-upload-area");
  const saveButton = document.getElementById("save-outfit-btn");

  const nextBtns = document.querySelectorAll(".next-step-btn");
  const backBtns = document.querySelectorAll(".back-step-btn");

  // --- STEP NAVIGATION (NEXT/BACK) ---
  nextStepHandlers = [];
  backStepHandlers = [];

  nextBtns.forEach((btn) => {
    const handler = () => {
      const target = btn.getAttribute("data-target");
      if (target) goToStep(target);
    };
    btn.addEventListener("click", handler);
    nextStepHandlers.push({ btn, handler });
  });

  backBtns.forEach((btn) => {
    const handler = () => {
      const target = btn.getAttribute("data-target");
      if (target) goToStep(target);
    };
    btn.addEventListener("click", handler);
    backStepHandlers.push({ btn, handler });
  });

  // --- FILE INPUT (HIDDEN) ---
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
  }

  // Trigger file input saat tombol atau area icon diklik
  handleUploadTrigger = () => fileInput.click();

  if (triggerUploadBtn) {
    triggerUploadBtn.addEventListener("click", handleUploadTrigger);
  }
  if (iconUploadArea) {
    iconUploadArea.addEventListener("click", handleUploadTrigger);
  }

  // Saat file dipilih
  fileInputChangeHandler = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    outfitData.imageFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview1 = document.getElementById("outfit-image-preview");
      const preview2 = document.getElementById("outfit-image-final");

      if (preview1) preview1.src = e.target.result;
      if (preview2) preview2.src = e.target.result;

      // Pindah ke Step 2 (Scanning)
      goToStep("step-2");

      // Simulasi scanning, lalu ke Step 3
      setTimeout(() => {
        goToStep("step-3");
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  fileInput.onchange = fileInputChangeHandler;

  // --- SIMPAN KE STORAGE + BACKEND ---
  if (saveButton) {
    saveClickHandler = async () => {
      const typeEl = document.getElementById("outfit-type");
      const colorEl = document.getElementById("outfit-color");

      const type = typeEl ? typeEl.value : "";
      const color = colorEl ? colorEl.value.trim() : "";

      if (!outfitData.imageFile) {
        alert("Gambar belum dipilih!");
        return;
      }
      if (!type || !color) {
        alert("Mohon lengkapi Tipe dan Warna pakaian.");
        return;
      }

      try {
        saveButton.textContent = "Saving...";
        saveButton.disabled = true;

        // 1. Upload ke Firebase Storage
        const filename = `outfits/${Date.now()}_${outfitData.imageFile.name}`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, outfitData.imageFile);
        const imageUrl = await getDownloadURL(storageRef);

        // 2. Simpan data ke Backend lewat addWardrobeItem
        const newItem = {
          type: type,
          category: type, // masih sama seperti sebelumnya
          color: color,
          imageUrl: imageUrl,
          userId: currentUser ? currentUser.uid : "guest",
          isLiked: false,
        };

        await addWardrobeItem(newItem);

        alert("Outfit saved successfully!");
        window.loadPage("wardrobe");
      } catch (error) {
        console.error("Gagal:", error);
        alert("Failed to save outfit. Check console.");
        saveButton.textContent = "Done";
        saveButton.disabled = false;
      }
    };

    saveButton.onclick = saveClickHandler; // assign (not addEventListener) to avoid stacking
  }
};

export const cleanupAddPagePage = () => {
  // Reset file input
  if (fileInput) {
    fileInput.value = "";
  }
  outfitData = {};

  // Remove upload triggers
  const triggerUploadBtn = document.getElementById("upload-btn-trigger");
  const iconUploadArea = document.getElementById("trigger-upload-area");
  if (triggerUploadBtn && handleUploadTrigger) {
    triggerUploadBtn.removeEventListener("click", handleUploadTrigger);
  }
  if (iconUploadArea && handleUploadTrigger) {
    iconUploadArea.removeEventListener("click", handleUploadTrigger);
  }

  // Remove next/back handlers
  nextStepHandlers.forEach(({ btn, handler }) => {
    btn.removeEventListener("click", handler);
  });
  backStepHandlers.forEach(({ btn, handler }) => {
    btn.removeEventListener("click", handler);
  });
  nextStepHandlers = [];
  backStepHandlers = [];

  // Clear save button handler
  const saveButton = document.getElementById("save-outfit-btn");
  if (saveButton) {
    saveButton.onclick = null;
  }

  // Clear fileInput onchange
  if (fileInput) {
    fileInput.onchange = null;
  }
};
