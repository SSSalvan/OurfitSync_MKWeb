// ------------------------------------------------------------
// EDIT OUTFIT — MENGGUNAKAN API.JS
// ------------------------------------------------------------
import { auth } from "../firebase-init.js";
// --- BARU: Import fungsi API
import { updateCalendarEvent, deleteCalendarEvent } from "../utils/api.js"; 

let cleanupFns = [];

// const API_BASE = "https://ourfit-sync-mk-web.vercel.app/api"; // <-- DIHAPUS

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
function normalizeOutfit(raw = {}) {
  return {
    Top: raw.Top || raw.top || null,
    Bottom: raw.Bottom || raw.bottom || null,
    Bag: raw.Bag || raw.bag || null,
    Shoes: raw.Shoes || raw.shoes || null,
  };
}

function stripUndefined(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function toDate(ds) {
  return new Date(ds + "T00:00:00");
}

function formatHeaderDate(ds) {
  const d = toDate(ds);
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const days = [
    "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"
  ];
  return {
    dayName: days[d.getDay()],
    dateText: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
  };
}

// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------
export function initEditOutfitPage(params = {}) {
  const root = document.getElementById("edit-outfit-page");
  if (!root) return;

  let event = null;

  if (params?.event) event = params.event;
  else if (params?.id) event = params;
  else event = {};

  console.log("DEBUG resolved event =", event);

  const eventID = event.id || event.docId || null;

  console.log("DEBUG resolved eventID =", eventID);

  if (!eventID) console.warn("⚠ Event ID missing", params);

  let selectedDate = event.date || new Date().toISOString().slice(0, 10);
  let selectedTime = (event.time || "morning").toLowerCase();
  let outfit = normalizeOutfit(event.outfit || {});
  let occasion = event.occasion || "";

  const weekGrid = root.querySelector("#eo-week-grid");
  const dayLabel = root.querySelector("#eo-week-day");
  const dateLabel = root.querySelector("#eo-week-date");
  const timeBtns = root.querySelectorAll(".eo-time-btn");
  const occasionInput = root.querySelector("#eo-occasion-input");
  const gridSlots = root.querySelectorAll(".eo-grid-slot");
  const saveBtn = root.querySelector(".eo-save-btn");
  const deleteBtn = root.querySelector(".eo-delete-btn");
  const backBtn = root.querySelector(".eo-back-btn");

  // ------------------------------------------------------------
  // HEADER DATE
  // ------------------------------------------------------------
  function updateHeader() {
    const { dayName, dateText } = formatHeaderDate(selectedDate);
    dayLabel.textContent = dayName;
    dateLabel.textContent = dateText;
  }

  // ------------------------------------------------------------
  // WEEK GRID
  // ------------------------------------------------------------
  function buildWeek() {
    weekGrid.innerHTML = "";

    const base = toDate(selectedDate);
    const offset = (base.getDay() + 6) % 7;
    const monday = new Date(base);
    monday.setDate(base.getDate() - offset);

    const short = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");

      const ds = `${yyyy}-${mm}-${dd}`;

      const cell = document.createElement("button");
      cell.className = "eo-week-cell";
      cell.dataset.date = ds;
      cell.innerHTML = `
        <div class="eo-week-cell-label">${short[i]}</div>
        <div class="eo-week-cell-num">${d.getDate()}</div>
      `;

      if (ds === selectedDate) cell.classList.add("selected");

      const handler = () => {
        selectedDate = ds;
        updateHeader();

        [...weekGrid.children].forEach(c => c.classList.remove("selected"));
        cell.classList.add("selected");
      };

      cell.addEventListener("click", handler);
      cleanupFns.push(() => cell.removeEventListener("click", handler));

      weekGrid.appendChild(cell);
    }
  }

  // ------------------------------------------------------------
  // OUTFIT GRID
  // ------------------------------------------------------------
  function buildOutfitGrid() {
    gridSlots.forEach(slot => {
      const part = slot.dataset.part;
      const img = slot.querySelector("img");
      img.src = outfit[part]?.imageUrl || "images/placeholder.png";

      const handler = () => {
        window.loadPage("wardrobe", {
          mode: "select",
          part,
          onSelect: item => {
            outfit[part] = item;
            img.src = item.imageUrl;
          }
        });
      };

      slot.addEventListener("click", handler);
      cleanupFns.push(() => slot.removeEventListener("click", handler));
    });
  }

  // ------------------------------------------------------------
  // TIME BUTTONS — FIXED
  // ------------------------------------------------------------
  function buildTimeButtons() {
    timeBtns.forEach(btn => {
      // normalize everything
      const t = btn.dataset.time.toLowerCase();

      // activate correct button on load
      if (t === selectedTime) btn.classList.add("is-active");

      const handler = () => {
        selectedTime = t; // always lowercase
        timeBtns.forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      };

      btn.addEventListener("click", handler);
      cleanupFns.push(() => btn.removeEventListener("click", handler));
    });
  }

  // ------------------------------------------------------------
  // SAVE EVENT (MENGGUNAKAN API.JS)
  // ------------------------------------------------------------
  async function saveEvent() {
    if (!eventID) return alert("Cannot save: event ID missing.");

    const user = auth.currentUser;
    if (!user) return alert("You must be logged in.");

    const cleaned = stripUndefined(outfit);

    const body = {
      userId: user.uid,
      date: selectedDate,
      time: selectedTime,
      occasion: occasionInput.value.trim(),
      outfit: cleaned
    };

    try {
      // --- DIUBAH: Menggunakan fungsi terpusat dari api.js
      await updateCalendarEvent(eventID, body); 
      window.loadPage("calendar");
    } catch (error) {
      console.error("SAVE ERROR:", error);
      alert("Failed to save event. " + error.message);
    }
  }

  // ------------------------------------------------------------
  // DELETE EVENT (MENGGUNAKAN API.JS)
  // ------------------------------------------------------------
  async function deleteEventFn() {
    if (!eventID) return alert("Cannot delete: event ID missing.");

    if (!confirm("Delete this event?")) return; 

    try {
      // --- DIUBAH: Menggunakan fungsi terpusat dari api.js
      await deleteCalendarEvent(eventID);
      window.loadPage("calendar");
    } catch (error) {
      console.error("DELETE ERROR:", error);
      alert("Failed to delete event. " + error.message);
    }
  }

  // ------------------------------------------------------------
  // BACK BUTTON
  // ------------------------------------------------------------
  if (backBtn) {
    const handler = () => window.loadPage("calendar");
    backBtn.addEventListener("click", handler);
    cleanupFns.push(() => backBtn.removeEventListener("click", handler));
  }

  // ------------------------------------------------------------
  // INIT UI
  // ------------------------------------------------------------
  occasionInput.value = occasion;
  updateHeader();
  buildWeek();
  buildTimeButtons();
  buildOutfitGrid();

  if (saveBtn) saveBtn.addEventListener("click", saveEvent);
  if (deleteBtn) deleteBtn.addEventListener("click", deleteEventFn);
}

export function cleanupEditOutfitPage() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
}