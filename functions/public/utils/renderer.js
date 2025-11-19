export function createItemCardHTML(item) {
  const imageUrl = item.imageUrl || 'images/logo-only.png';
  const isLiked = item.isLiked || false;
  
  const heartSVG = `
    <svg viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  `;
  
  return `
    <div class="item-card" data-id="${item.id}">
      <img src="${imageUrl}" alt="${item.name || 'Item'}">
      <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${item.id}" data-liked="${isLiked}">
        ${heartSVG}
      </button>
    </div>
  `;
}

/**
 * Merender daftar item ke kontainer di halaman.
 */
export function renderItemsToContainer(items, containerId, emptyMsgId) {
  const container = document.getElementById(containerId);
  const emptyMsg = document.getElementById(emptyMsgId);
  if (!container) {
    console.error(`Error: Kontainer #${containerId} tidak ditemukan.`);
    return;
  }
  if (!emptyMsg) {
     console.error(`Error: Pesan kosong #${emptyMsgId} tidak ditemukan.`);
     return;
  }

  container.innerHTML = '';
  if (items.length === 0) {
    emptyMsg.style.display = 'block';
  } else {
    emptyMsg.style.display = 'none';
    let html = '';
    items.forEach(item => {
      html += createItemCardHTML(item);
    });
    container.innerHTML = html;
  }
}