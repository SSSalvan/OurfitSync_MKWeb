// File: page-logic/logic-edit-outfit.js
import { db } from "../firebase-init.js";
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let currentEvent = null;
let listeners = [];

export async function initEditOutfitPage() {
  const root = document.getElementById("edit-outfit-page");
  if (!root) return;

  // Back
  const backBtn = root.querySelector(".eo-back-btn");
  if (backBtn) {
    const handler = () => window.loadPage && window.loadPage("calendar");
    backBtn.addEventListener("click", handler);
    listeners.push(() => backBtn.removeEventListener("click", handler));
  }

  const eventId = localStorage.getItem("editOutfitEventId");
  if (!eventId) {
    console.warn("No editOutfitEventId set.");
    return;
  }

  try {
    const snap = await getDoc(doc(db, "calendarEvents", eventId));
    if (!snap.exists()) {
      console.warn("calendarEvents doc not found:", eventId);
      return;
    }
    currentEvent = { id: snap.id, ...snap.data() };
    renderFromEvent(root, currentEvent);
  } catch (err) {
    console.error("Failed to load calendar event:", err);
  }

  // Delete (optional)
  const deleteBtn = root.querySelector("#eo-delete-btn");
  if (deleteBtn && currentEvent) {
    const handler = async () => {
      if (!confirm("Delete this outfit from calendar?")) return;
      await deleteDoc(doc(db, "calendarEvents", currentEvent.id));
      window.loadPage && window.loadPage("calendar");
    };
    deleteBtn.addEventListener("click", handler);
    listeners.push(() => deleteBtn.removeEventListener("click", handler));
  }

  // Edit button stub (you can expand later)
  const editBtn = root.querySelector("#eo-edit-btn");
  if (editBtn) {
    const handler = async () => {
      alert("Edit logic not implemented yet – you can hook updateDoc here.");
    };
    editBtn.addEventListener("click", handler);
    listeners.push(() => editBtn.removeEventListener("click", handler));
  }
}

export function cleanupEditOutfitPage() {
  listeners.forEach((fn) => fn());
  listeners = [];
}

function renderFromEvent(root, evt) {
  // ----- Outfit grid -----
  const outfit = evt.outfit || {};
  ["Top", "Bag", "Bottom", "Shoes"].forEach((part) => {
    const slotImg = root.querySelector(`.eo-slot[data-part="${part}"] img`);
    if (!slotImg) return;
    const data = outfit[part];
    if (data && data.imageUrl) {
      slotImg.src = data.imageUrl;
      slotImg.alt = `${part} outfit item`;
    } else {
      slotImg.src = "images/placeholder-item.png";
      slotImg.alt = "Placeholder";
    }
  });

  // liked
  const likeBtn = root.querySelector(".eo-like-btn");
  if (likeBtn) {
    likeBtn.textContent = evt.isLiked ? "♥" : "♡";
  }

  // ----- Date + weekday text -----
  const dateStr = evt.date; // "YYYY-MM-DD"
  const [yyyy, mm, dd] = dateStr.split("-").map(Number);
  const dateObj = new Date(yyyy, mm - 1, dd);

  const weekdayLabel = root.querySelector("#eo-weekday-label");
  const dateLabel = root.querySelector("#eo-date-label");
  if (weekdayLabel) weekdayLabel.textContent = WEEKDAY_LONG[dateObj.getDay()];
  if (dateLabel)
    dateLabel.textContent = `${dd} ${
      MONTH_NAMES[dateObj.getMonth()]
    } ${dateObj.getFullYear()}`;

  // ----- Week strip -----
  buildWeekStrip(root, dateObj);

  // ----- Time icons -----
  const time = evt.time || "Night";
  root.querySelectorAll(".eo-time-btn").forEach((btn) => {
    btn.classList.toggle("is-selected", btn.dataset.time === time);
  });

  // ----- Occasion text -----
  const occEl = root.querySelector("#eo-occasion-text");
  if (occEl) occEl.textContent = evt.occasion || "";
}

function buildWeekStrip(root, selectedDate) {
  const strip = root.querySelector("#eo-week-strip");
  if (!strip) return;
  strip.innerHTML = "";

  // find Monday of the week that contains selectedDate
  const jsDay = selectedDate.getDay(); // 0=Sun
  const mondayOffset = (jsDay + 6) % 7;
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() - mondayOffset);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const cell = document.createElement("div");
    cell.className = "eo-week-cell";

    const labelRow = document.createElement("div");
    labelRow.className = "eo-week-label-row";

    const nameSpan = document.createElement("span");
    nameSpan.className = "eo-week-name";
    nameSpan.textContent = WEEKDAY_SHORT[i];

    const flame = document.createElement("span");
    flame.className = "eo-week-flame";
    flame.textContent = "•"; // placeholder flame icon

    labelRow.appendChild(nameSpan);
    labelRow.appendChild(flame);

    const num = document.createElement("div");
    num.className = "eo-week-number";
    num.textContent = d.getDate();

    // highlight currently selected date
    if (d.toDateString() === selectedDate.toDateString()) {
      cell.classList.add("is-selected");
    }

    cell.appendChild(labelRow);
    cell.appendChild(num);
    strip.appendChild(cell);
  }
}
