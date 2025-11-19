// GANTI URL INI DENGAN URL FUNCTION ANDA
// Contoh: https://asia-southeast2-outfitsync-123.cloudfunctions.net/api
const API_BASE_URL = "https://asia-southeast2-outfitsync-b8652.cloudfunctions.net/api"; 

// --- API CALLS UNTUK WARDROBE ---

export async function fetchWardrobe(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/wardrobe?userId=${userId}`);
    if (!res.ok) throw new Error("Gagal mengambil data wardrobe");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function addWardrobeItem(itemData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/wardrobe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    if (!res.ok) throw new Error("Gagal menambah item");
    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// --- API CALLS UNTUK CALENDAR ---

export async function fetchCalendarEvents(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/calendar?userId=${userId}`);
    if (!res.ok) throw new Error("Gagal mengambil kalender");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function saveCalendarEvent(eventData) {
    const res = await fetch(`${API_BASE_URL}/api/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });
    if (!res.ok) throw new Error("Gagal menyimpan event");
    return await res.json();
}

// --- API CALLS UNTUK USER ---

export async function fetchUserProfile(uid) {
    const res = await fetch(`${API_BASE_URL}/api/users/${uid}`);
    if (!res.ok) return null;
    return await res.json();
}

export async function saveUserProfile(uid, data) {
    await fetch(`${API_BASE_URL}/api/users/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}