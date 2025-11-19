// File: page-logic/logic-outfit-summary.js

// simple map for nice labels
const CATEGORY_LABELS = {
  top: { title: 'Formal', subtitle: 'Top' },
  bottom: { title: 'Formal', subtitle: 'Bottom' },
  shoes: { title: 'Formal', subtitle: 'Shoes' },
  bag: { title: 'Formal', subtitle: 'Bag' }
};

let cleanupFns = [];

function buildCards(selection) {
  const container = document.getElementById('os-cards-container');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(selection).forEach(([key, item]) => {
    const labels = CATEGORY_LABELS[key] || { title: 'Item', subtitle: key };

    const card = document.createElement('div');
    card.className = 'os-card';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'os-card-img-wrap';

    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = item.alt || labels.subtitle;

    imgWrap.appendChild(img);

    const text = document.createElement('div');
    text.className = 'os-card-text';

    const main = document.createElement('div');
    main.className = 'os-card-main';
    main.textContent = labels.title;

    const sub = document.createElement('div');
    sub.className = 'os-card-sub';
    sub.textContent = labels.subtitle;

    text.appendChild(main);
    text.appendChild(sub);

    card.appendChild(imgWrap);
    card.appendChild(text);

    container.appendChild(card);
  });
}

function buildCollage(selection) {
  const collage = document.getElementById('os-collage');
  if (!collage) return;
  collage.innerHTML = '';

  const topRow = document.createElement('div');
  topRow.className = 'os-collage-row os-collage-top';

  const bottomRow = document.createElement('div');
  bottomRow.className = 'os-collage-row os-collage-bottom';

  const accessoryRow = document.createElement('div');
  accessoryRow.className = 'os-collage-row os-collage-accessory';

  if (selection.top) {
    const img = document.createElement('img');
    img.src = selection.top.imageUrl;
    img.alt = selection.top.alt || 'Top';
    topRow.appendChild(img);
  }

  if (selection.bottom) {
    const img = document.createElement('img');
    img.src = selection.bottom.imageUrl;
    img.alt = selection.bottom.alt || 'Bottom';
    bottomRow.appendChild(img);
  }

  if (selection.shoes) {
    const img = document.createElement('img');
    img.src = selection.shoes.imageUrl;
    img.alt = selection.shoes.alt || 'Shoes';
    bottomRow.appendChild(img);
  }

  if (selection.bag) {
    const img = document.createElement('img');
    img.src = selection.bag.imageUrl;
    img.alt = selection.bag.alt || 'Bag';
    accessoryRow.appendChild(img);
  }

  if (topRow.children.length) collage.appendChild(topRow);
  if (bottomRow.children.length) collage.appendChild(bottomRow);
  if (accessoryRow.children.length) collage.appendChild(accessoryRow);
}

export function initOutfitSummaryPage() {
  const root = document.getElementById('outfit-summary-page');
  if (!root) return;

  // read selection from create-outfit page
  let selection = {};
  try {
    const raw = sessionStorage.getItem('currentOutfitSelection');
    if (raw) selection = JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse outfit selection', e);
  }

  buildCards(selection);
  buildCollage(selection);

  // Back button → go to create-outfit page
  const backBtn = document.querySelector('.backBtn');
  if (backBtn) {
    const handler = () => {
      window.dispatchEvent(
        new CustomEvent('navigate', { detail: { page: 'create-outfit' } })
      );
    };
    backBtn.addEventListener('click', handler);
    cleanupFns.push(() => backBtn.removeEventListener('click', handler));
  }


  // Save to calendar → go to date selector page
    const saveCalendarBtn = document.getElementById('os-save-calendar-btn');
    if (saveCalendarBtn) {
    const handler = () => {
        window.loadPage('save-calendar');
    };
    saveCalendarBtn.addEventListener('click', handler);
    cleanupFns.push(() =>
        saveCalendarBtn.removeEventListener('click', handler)
    );
    }


  const saveImagesBtn = document.getElementById('os-save-images-btn');
  if (saveImagesBtn) {
    const handler = () => {
      console.log('Save images clicked (not implemented yet)');
    };
    saveImagesBtn.addEventListener('click', handler);
    cleanupFns.push(() =>
      saveImagesBtn.removeEventListener('click', handler)
    );
  }
}

export function cleanupOutfitSummaryPage() {
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];
}
