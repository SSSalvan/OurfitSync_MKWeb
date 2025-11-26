// File: api.js (Harusnya berada di folder 'utils' jika file logic Anda di 'page-logic')

const API_BASE_URL = "https://ourfit-sync-mk-web.vercel.app";

// --- WARDROBE --
export async function fetchWardrobe(userId) {
  try {
    // Mengambil semua item wardrobe milik user
    const res = await fetch(`${API_BASE_URL}/api/wardrobe?userId=${userId}`);
    if (!res.ok) throw new Error("Gagal mengambil data wardrobe");
    
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching wardrobe:", error);
    throw error; // Propagate the error for UI handling
  }
}

export async function addWardrobeItem(itemData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/wardrobe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData)
    });
    if (!res.ok) throw new Error("Gagal menambahkan item wardrobe");
    return await res.json();
  } catch (error) {
    console.error("Error adding wardrobe item:", error);
    throw error;
  }
}

// --- CALENDAR ---

export async function fetchCalendarEvents(userId) {
  try {
    // Mengambil semua event calendar milik user
    const res = await fetch(`${API_BASE_URL}/api/calendar/user/${userId}`);
    if (!res.ok) throw new Error("Gagal mengambil event kalender");
    return await res.json();
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
}

export async function saveCalendarEvent(eventData) {
    const res = await fetch(`${API_BASE_URL}/api/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error("Gagal menyimpan event:", errorText);
        throw new Error("Gagal menyimpan event");
    }
    return await res.json();
}

export async function updateCalendarEvent(eventId, eventData) {
    const res = await fetch(`${API_BASE_URL}/api/calendar/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error("Gagal update event:", errorText);
        throw new Error("Gagal update event");
    }
    return await res.json();
}

export async function deleteCalendarEvent(eventId) {
    const res = await fetch(`${API_BASE_URL}/api/calendar/${eventId}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error("Gagal menghapus event:", errorText);
        throw new Error("Gagal menghapus event");
    }
    // As DELETE might return 204 No Content, we check status instead of parsing JSON
    return res.status;
}


export async function fetchUserProfile(uid) {
    const res = await fetch(`${API_BASE_URL}/api/users/${uid}`);
    if (!res.ok) return null;
    return await res.json();
}

export async function saveUserProfile(uid, profileData) {
    const res = await fetch(`${API_BASE_URL}/api/users/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error("Gagal menyimpan profil");
    return await res.json();
}