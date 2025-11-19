import { auth, storage } from '../firebase-init.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { addWardrobeItem } from '../utils/api.js';

let outfitData = {};
let fileInput;

// Helper navigasi antar step
function goToStep(stepId) {
    document.querySelectorAll('.outfit-step').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(stepId);
    if (target) target.classList.add('active');
}

export const initAddPagePage = () => {
    const currentUser = auth.currentUser;
    
    // Tombol-tombol utama
    const triggerUploadBtn = document.getElementById('upload-btn-trigger');
    const iconUploadArea = document.getElementById('trigger-upload-area');
    const saveButton = document.getElementById('save-outfit-btn');

    // Setup Navigasi Manual (Next/Back buttons)
    const nextBtns = document.querySelectorAll('.next-step-btn');
    const backBtns = document.querySelectorAll('.back-step-btn');

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            goToStep(target);
        });
    });

    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            goToStep(target);
        });
    });

    // Setup File Input (Hidden)
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }

    // Trigger file input saat tombol atau area icon diklik
    const handleUploadTrigger = () => fileInput.click();
    if (triggerUploadBtn) triggerUploadBtn.addEventListener('click', handleUploadTrigger);
    if (iconUploadArea) iconUploadArea.addEventListener('click', handleUploadTrigger);

    // Saat file dipilih
    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Simpan file ke variabel global
            outfitData.imageFile = file;

            const reader = new FileReader();
            reader.onload = function(e) {
                // Tampilkan preview di Step 2 dan Step 3
                const preview1 = document.getElementById('outfit-image-preview');
                const preview2 = document.getElementById('outfit-image-final');
                
                if(preview1) preview1.src = e.target.result;
                if(preview2) preview2.src = e.target.result;

                // Otomatis pindah ke Step 2 (Scan)
                goToStep('step-2');

                // Simulasi "Scanning..." lalu pindah ke Step 3 setelah 1.5 detik
                // (Opsional, supaya mirip efek 'Scan' di Figma)
                setTimeout(() => {
                    goToStep('step-3');
                }, 1500);
            };
            reader.readAsDataURL(file);
        }
    };

    // Logic Simpan ke Database
    if (saveButton) {
        saveButton.onclick = async () => {
            const type = document.getElementById('outfit-type').value;
            const color = document.getElementById('outfit-color').value;

            if (!outfitData.imageFile) {
                alert('Gambar belum dipilih!');
                return;
            }
            if (!type || !color) {
                alert('Mohon lengkapi Tipe dan Warna pakaian.');
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

                // 2. Simpan data ke Backend
                const newItem = {
                    type: type,          
                    category: type,     
                    color: color,
                    imageUrl: imageUrl,
                    userId: currentUser ? currentUser.uid : "guest",
                    isLiked: false
                };

                await addWardrobeItem(newItem); 
                
                alert('Outfit saved successfully!');
                window.loadPage('wardrobe'); // Redirect ke wardrobe

            } catch (error) {
                console.error('Gagal:', error);
                alert('Failed to save outfit. Check console.');
                saveButton.textContent = "Done";
                saveButton.disabled = false;
            }
        };
    }
};

export const cleanupAddPagePage = () => {
    // Reset input jika perlu
    if (fileInput) fileInput.value = '';
    outfitData = {};
};