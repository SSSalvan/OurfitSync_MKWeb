const API_BASE_URL = "https://ourfit-sync-mk-web.vercel.app/api";

// =======================================
// WARDROBE
// =======================================
export async function fetchWardrobe(userId) {
  const res = await fetch(`${API_BASE_URL}/wardrobe?userId=${userId}`);
  if (!res.ok) throw new Error("Gagal mengambil wardrobe");
  return await res.json();
}

export async function addWardrobeItem(itemData) {
  const res = await fetch(`${API_BASE_URL}/wardrobe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(itemData),
  });
  if (!res.ok) throw new Error("Gagal menambahkan item");
  return await res.json();
}

// =======================================
// USER PROFILE
// =======================================
export async function fetchUserProfile(uid) {
  const res = await fetch(`${API_BASE_URL}/users/${uid}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function saveUserProfile(uid, profileData) {
  const res = await fetch(`${API_BASE_URL}/users/${uid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) throw new Error("Gagal menyimpan profil");
  return await res.json();
}

// =======================================
// CALENDAR APIs
// =======================================
export async function fetchCalendarEvents(userId) {
  const res = await fetch(`${API_BASE_URL}/calendar/user/${userId}`);
  if (!res.ok) throw new Error("Gagal mengambil event");
  return await res.json();
}

export async function saveCalendarEvent(eventData) {
  const res = await fetch(`${API_BASE_URL}/calendar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) throw new Error("Gagal menyimpan event");
  return await res.json();
}

export async function updateCalendarEvent(eventId, eventData) {
  const res = await fetch(`${API_BASE_URL}/calendar/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) throw new Error("Gagal update event");
  return await res.json();
}

export async function deleteCalendarEvent(eventId) {
  const res = await fetch(`${API_BASE_URL}/calendar/${eventId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Gagal hapus event");
  return res.json();
}
