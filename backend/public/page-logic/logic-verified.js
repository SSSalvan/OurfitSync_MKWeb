export function initVerifiedPage() {
  const doneBtn = document.getElementById('btn-done-verified');
  if(doneBtn) {
    doneBtn.addEventListener('click', () => {
      window.loadPage('home'); 
    });
  }
}

export function cleanupVerifiedPage() {
  // Tidak ada listener
}