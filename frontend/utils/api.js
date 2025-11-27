const API_BASE_URL = "/api"; // Pastikan Vercel routing benar

// =======================================
// WARDROBE
// =======================================
export async function fetchWardrobe(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/wardrobe?userId=${userId}`);
    // Jika backend 500/400, kita throw error
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Fetch wardrobe error:", error);
    // Return array kosong agar UI tidak crash
    return [];
  }
}

export async function addWardrobeItem(itemData) {
  try {
    const res = await fetch(`${API_BASE_URL}/wardrobe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Add wardrobe item error:", error);
    throw error;
  }
}

// =======================================
// USER PROFILE
// =======================================
export async function fetchUserProfile(uid) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${uid}`);
    // Backend kita sekarang return JSON meskipun user baru (tidak 404)
    if (!res.ok) return null; 
    return await res.json();
  } catch (error) {
    console.error("Fetch user profile error:", error);
    return null;
  }
}

export async function saveUserProfile(uid, profileData) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${uid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Save user profile error:", error);
    throw error;
  }
}

// ... Bagian Calendar biarkan seperti semula ...
export async function fetchCalendarEvents(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/calendar/user/${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Fetch calendar events error:", error);
    throw error;
  }
}

export async function saveCalendarEvent(eventData) {
    const res = await fetch(`${API_BASE_URL}/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function updateCalendarEvent(eventId, eventData) {
    const res = await fetch(`${API_BASE_URL}/calendar/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

export async function deleteCalendarEvent(eventId) {
    const res = await fetch(`${API_BASE_URL}/calendar/${eventId}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}