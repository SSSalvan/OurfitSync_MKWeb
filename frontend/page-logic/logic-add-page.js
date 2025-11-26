// File: logic-add-page.js
// Add Outfit page logic – minimal fixes, same behavior

import { auth, storage } from "../firebase-init.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
// --- Sudah benar, menggunakan fungsi API
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

  // Step 1: Upload
  fileInput = document.getElementById("file-input");

  handleUploadTrigger = () => {
    fileInput.click();
  };
  triggerUploadBtn.addEventListener("click", handleUploadTrigger);
  iconUploadArea.addEventListener("click", handleUploadTrigger);

  fileInputChangeHandler = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Tampilkan preview
      const previewImg = document.getElementById("upload-preview");
      previewImg.src = URL.createObjectURL(file);
      document.getElementById("upload-card-content").style.display = "none";
      document.getElementById("upload-preview-container").style.display = "block";

      outfitData.file = file;
      goToStep("step-2-details");
    }
  };
  fileInput.addEventListener("change", fileInputChangeHandler);

  // Navigasi antar step
  nextBtns.forEach((btn) => {
    const target = btn.dataset.target;
    const handler = () => {
      if (target === "step-2-details" && !outfitData.file) return alert("Please upload an image first.");
      goToStep(target);
    };
    btn.addEventListener("click", handler);
    nextStepHandlers.push({ btn, handler });
  });

  backBtns.forEach((btn) => {
    const target = btn.dataset.target;
    const handler = () => goToStep(target);
    btn.addEventListener("click", handler);
    backStepHandlers.push({ btn, handler });
  });

  // Step 3: Save Logic
  if (saveButton && currentUser) {
    saveClickHandler = async () => {
      saveButton.textContent = "Saving...";
      saveButton.disabled = true;

      const name = document.getElementById("outfit-name").value;
      const category = document.getElementById("outfit-category").value;

      if (!name || !category) {
        alert("Name and Category are required!");
        saveButton.textContent = "Done";
        saveButton.disabled = false;
        return;
      }

      let imageUrl = null;
      try {
        // 1. Upload Gambar ke Firebase Storage
        const file = outfitData.file;
        const fileName = `${currentUser.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);

        // 2. Simpan Data ke Vercel API
        const itemData = {
          userId: currentUser.uid,
          name: name,
          category: category,
          imageUrl: imageUrl, // URL gambar dari Firebase Storage
          timestamp: new Date().toISOString(),
          // Anda bisa tambahkan field lain seperti color, tags, dll.
        };

        // --- Sudah benar: Menggunakan fungsi terpusat dari api.js
        await addWardrobeItem(itemData); 

        alert("Item added successfully!");
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
  if (saveButton && saveClickHandler) {
    saveButton.onclick = null;
  }
};