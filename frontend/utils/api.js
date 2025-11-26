const API_BASE_URL = "https://ourfit-sync-mk-web15.vercel.app/api";

// =======================================
// WARDROBE
// =======================================
export async function fetchWardrobe(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/wardrobe?userId=${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Fetch wardrobe error:", error);
    throw error;
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

// =======================================
// CALENDAR APIs
// =======================================
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
  try {
    const res = await fetch(`${API_BASE_URL}/calendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Save calendar event error:", error);
    throw error;
  }
}

export async function updateCalendarEvent(eventId, eventData) {
  try {
    const res = await fetch(`${API_BASE_URL}/calendar/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Update calendar event error:", error);
    throw error;
  }
}

export async function deleteCalendarEvent(eventId) {
  try {
    const res = await fetch(`${API_BASE_URL}/calendar/${eventId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    console.error("Delete calendar event error:", error);
    throw error;
  }
}