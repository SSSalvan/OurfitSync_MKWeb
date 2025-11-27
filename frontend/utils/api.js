import { db } from "../firebase-init.js"; // Pastikan db diekspor dari firebase-init.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =======================================
// WARDROBE (Direct Firestore)
// =======================================

const firebaseConfig = {
  "type": "service_account",
  "project_id": "outfitsync-b8652",
  "private_key_id": "7b9abd4f8e52c4ee23fd3e40bd38ad1018238cef",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCppG2/Wypcs9C4\nRPXZQQrBmn0Jk9gZjK3gsqaDgny4+JOdOKUMy07vpSdnxjJhcQQzv5pzfA0O5RVJ\npR0g6DL4iSr3v0AKkFvEwCo93RkgDCxs4ApX1Iwp7aif+RioCALidS+MMfQ9E/Ot\n4DM3soh3BPAORGwR+uJUX381FyTUqLzaiiUAk6EKvJYKuUE32ZouRTy4DIibWL37\nrbshbcgRiM1OLTBkyWqTgfF1CSFLlcuyKA/Npkrv/77Ax9uJhd4RklTlRjSOpA1C\nMMu1tdbr1Asb0b/lREGXMH+naB3lxnZaj9JJmwzGMXL1IS6tlql7jRlwmlgrnXpI\nn15Fr3PbAgMBAAECggEAAj2jcXlLzZ5WbciuEqjoR8xkRcHH2KE3aWtoBalYlRI7\nfkJ8SPdP20csMRO4y060hoEhEiYbqgxemUgZYruOc3f5svy6D37+p1JT0di0zJaR\n6PzrRg5kV5LFvRng4yn6l8aCfUXqUFA40h15r7enqSLN5PJZwcG1nEsH9snlI6Xy\nwYNLDhCUz2iK6qT0HlE26qZvM/sLyYZYa2i7d+RgeZfuydDdrtsqNjVjOz18C724\nKNOV7ZPTJZNCxq7awWABpLTpJCzdRwyLmJ/SBGVWxgW0RnWKssPo2Be2zFUVtIL0\nRkwMu2lY0mbQ4mQISuCjusdyN4RXtfnynpZxuOrn4QKBgQDesSw2JUHjO/Z041re\nn14F65Z7+lKE8OlGE3SvCJwYMdLqOhdqIyWE9ytGQp4c4SeR0/6Pwm6+3EE/HGmI\nnL9jOnE7r48s0434XotdhYAPgeV5LgqBd5+uIrxnlR1ON/uvS4+LpfQ6168Z9yLq\nyXSyf64kPnuUo9PnQRukLlpXUQKBgQDDA/4MbAlslbFuYapCeoQWBovmkeKyLB8M\nI2vyxo30sCzaYSyxigoZcw4vM2OjWdc89ZmN5Qr5YJxi3+soLIZ/wWCgO4d7SWH9\nrIScwB+Mp5jrMJFgDNv+A53sF9jY3f9hph6g5Xn/cwC8MkNDU4r3DqWWkw0mZ9n1\nckCz31plawKBgB74EKfvAnyxaBLVU1vGWfME0kanhzZJsoc2SXHWBq8urqA4N+1g\nueUF4pTAyvBFN5WGH86qQXB1fPVj5CFFezA3fmvIfGbFfObfbw4wdKCzddAmYPuk\nQSacWgslp4+rJWs5XNsU1yQfvpAj2E1CeuIf833C2rjPF7b/TPLGJ3YhAoGAa0sS\nBhGWqcg+I4XWX9b6PwgBBq0y9WYy+sGuTZcSWRJoywl1xoQ1BEV6A1wZsLDoK+DQ\nR/JBNG0D/Z5GygadRULGf8Hgy2LXZ/L3zyog8YjwKE3DXf4VN08UHuYL511UeYwl\nA87dbT7/o4tf2HXpWf4T+qETNhMjJthiYtQ67tsCgYEAq9TTo9yZ7/bGRcpcgDC2\naX1JfSyK/h3MuAiZS6vSCEWHs0+xZ58L9J5ky44Ify8p2vQvVQmD1HU3UL0kXTEn\n6JIo37hluD2AkUWRZFrm2DM67hcLxJKZIsAB1Xtx/SntQdE+RHXgnLdLSy13Asuh\nsr39xYeYGFap5h7TvWyFzrc=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@outfitsync-b8652.iam.gserviceaccount.com",
  "client_id": "112505314908052986072",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40outfitsync-b8652.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

export async function fetchWardrobe(userId) {
  try {
    // Menggunakan koleksi 'wardrobeItems' agar sinkron dengan Android App
    const q = query(
      collection(db, "wardrobeItems"), 
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Convert snapshot ke array object
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return items;
  } catch (error) {
    console.error("Fetch wardrobe error:", error);
    return []; // Return array kosong agar UI aman
  }
}

export async function addWardrobeItem(itemData) {
  try {
    // Tambahkan timestamp di sisi client jika belum ada
    const dataToSend = {
      ...itemData,
      createdAt: new Date().toISOString(), // atau serverTimestamp() jika mau
      isLiked: false
    };

    const docRef = await addDoc(collection(db, "wardrobeItems"), dataToSend);
    return { id: docRef.id, ...dataToSend };
  } catch (error) {
    console.error("Add wardrobe item error:", error);
    throw error;
  }
}

// =======================================
// USER PROFILE (Direct Firestore)
// =======================================
export async function fetchUserProfile(uid) {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { uid: uid, ...docSnap.data() };
    } else {
      // Graceful Fallback: Return objek default agar UI tidak loading terus
      return { 
        uid: uid, 
        notFound: true,
        name: "User",
        email: "" 
      };
    }
  } catch (error) {
    console.error("Fetch user profile error:", error);
    return null;
  }
}

export async function saveUserProfile(uid, profileData) {
  try {
    const docRef = doc(db, "users", uid);
    // Gunakan setDoc dengan merge: true (mirip PUT/PATCH)
    await setDoc(docRef, profileData, { merge: true });
    return { uid, ...profileData };
  } catch (error) {
    console.error("Save user profile error:", error);
    throw error;
  }
}

// =======================================
// CALENDAR APIs (Direct Firestore)
// =======================================
export async function fetchCalendarEvents(userId) {
  try {
    const q = query(
      collection(db, "calendar_events"), 
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Fetch calendar events error:", error);
    throw error;
  }
}

export async function saveCalendarEvent(eventData) {
  try {
    const docRef = await addDoc(collection(db, "calendar_events"), eventData);
    return { id: docRef.id, ...eventData };
  } catch (error) {
    console.error("Save calendar event error:", error);
    throw error;
  }
}

export async function updateCalendarEvent(eventId, eventData) {
  try {
    const docRef = doc(db, "calendar_events", eventId);
    await updateDoc(docRef, eventData);
    return { id: eventId, ...eventData };
  } catch (error) {
    console.error("Update calendar event error:", error);
    throw error;
  }
}

export async function deleteCalendarEvent(eventId) {
  try {
    const docRef = doc(db, "calendar_events", eventId);
    await deleteDoc(docRef);
    return { success: true, id: eventId };
  } catch (error) {
    console.error("Delete calendar event error:", error);
    throw error;
  }
}