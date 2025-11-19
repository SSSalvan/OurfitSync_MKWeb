// File: page-logic/logic-save-calendar.js

import { db, auth } from '../firebase-init.js';
import {
  collection,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentYear;
let currentMonth; // 0-11
let selectedDateISO = null; // "YYYY-MM-DD"
let selectedTimeSlot = null;
let cleanupFns = [];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getMondayIndex(date) {
  // convert JS Sunday=0..Saturday=6 → Monday=0..Sunday=6
  const weekday = date.getDay(); // 0-6
  return (weekday + 6) % 7;
}

function renderCalendar() {
  const label = document.getElementById("sc-month-label");
  const daysContainer = document.getElementById("sc-calendar-days");
  if (!label || !daysContainer) return;

  label.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
  daysContainer.innerHTML = "";

  const firstOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const leadingEmpty = getMondayIndex(firstOfMonth);

  // prev month faint days
  for (let i = leadingEmpty - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const el = document.createElement("div");
    el.className = "sc-day sc-day--disabled";
    el.textContent = dayNum;
    daysContainer.appendChild(el);
  }

  // current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement("button");
    btn.className = "sc-day sc-day--current";
    btn.textContent = d;

    const dateObj = new Date(currentYear, currentMonth, d);
    const iso = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
    btn.dataset.date = iso;

    if (selectedDateISO === iso) {
      btn.classList.add("is-selected");
    }

    const handler = () => {
      selectedDateISO = iso;
      updateSelectedDayHighlight();
    };
    btn.addEventListener("click", handler);
    cleanupFns.push(() => btn.removeEventListener("click", handler));

    daysContainer.appendChild(btn);
  }

  // (optional) add trailing next-month days to fill grid – not required visually
}

function updateSelectedDayHighlight() {
  const days = document.querySelectorAll(".sc-day.sc-day--current");
  days.forEach(day => {
    if (day.dataset.date === selectedDateISO) {
      day.classList.add("is-selected");
    } else {
      day.classList.remove("is-selected");
    }
  });
}

function setupMonthNav() {
  const prevBtn = document.getElementById("sc-prev-month");
  const nextBtn = document.getElementById("sc-next-month");

  if (prevBtn) {
    const handler = () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    };
    prevBtn.addEventListener("click", handler);
    cleanupFns.push(() => prevBtn.removeEventListener("click", handler));
  }

  if (nextBtn) {
    const handler = () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    };
    nextBtn.addEventListener("click", handler);
  cleanupFns.push(() => nextBtn.removeEventListener("click", handler));
  }
}

function setupTimeOptions() {
  const container = document.getElementById("sc-time-options");
  if (!container) return;

  const buttons = container.querySelectorAll(".sc-time-btn");
  buttons.forEach(btn => {
    const slot = btn.dataset.slot;
    const handler = () => {
      selectedTimeSlot = slot;
      buttons.forEach(b => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
    };
    btn.addEventListener("click", handler);
    cleanupFns.push(() => btn.removeEventListener("click", handler));
  });
}

function getCurrentOutfitSelection() {
  try {
    const raw = sessionStorage.getItem("currentOutfitSelection");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to read outfit from sessionStorage", e);
    return {};
  }
}

async function handleSaveToCalendar() {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to save to calendar.");
    return;
  }

  if (!selectedDateISO) {
    alert("Please select a date.");
    return;
  }

  if (!selectedTimeSlot) {
    alert("Please select a time for your outfit.");
    return;
  }

  const occasionInput = document.getElementById("sc-occasion-input");
  const occasion = (occasionInput?.value || "").trim();

  const outfitSelection = getCurrentOutfitSelection();

  // Convert our outfit selection into your required Firestore structure
  const outfitMap = {};

  const categoryMap = {
    top: "Top",
    bottom: "Bottom",
    shoes: "Shoes",
    bag: "Bag"
  };

  for (const key of Object.keys(outfitSelection)) {
    const item = outfitSelection[key];
    const properCategory = categoryMap[key];

    outfitMap[properCategory] = {
      category: properCategory,
      color: item.color || "",
      imageUrl: item.imageUrl || "",
      liked: false,
      style: item.style || "",
    };
  }

  const docData = {
    userId: user.uid,
    date: selectedDateISO,          // string "2025-11-11"
    time: selectedTimeSlot,  // keep lowercase, since your icons use lowercase slots
    occasion: occasion,
    isLiked: false,
    outfit: outfitMap,
    timestamp: Timestamp.now()
  };

  console.log("Saving event:", docData);

  await addDoc(collection(db, "calendarEvents"), docData);

  alert("Outfit saved to calendar!");

  // go back to calendar page
  window.loadPage("calendar");
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ----------- PUBLIC API ----------- */

export function initSaveCalendarPage() {
  const root = document.getElementById("save-calendar-page");
  if (!root) return;

  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  selectedDateISO = today.toISOString().slice(0, 10); // default: today

  renderCalendar();
  setupMonthNav();
  setupTimeOptions();
  updateSelectedDayHighlight();

  // Save button
  const saveBtn = document.getElementById("sc-save-btn");
  if (saveBtn) {
    const handler = () => {
      handleSaveToCalendar().catch(err => {
        console.error("Failed to save outfit to calendar:", err);
        alert("Failed to save outfit. Please try again.");
      });
    };
    saveBtn.addEventListener("click", handler);
    cleanupFns.push(() => saveBtn.removeEventListener("click", handler));
  }

  // Back button → go back to outfit summary
  const backBtn = document.querySelector('.backBtn');
  if (backBtn) {
    const handler = () => {
      window.dispatchEvent(
        new CustomEvent('navigate', { detail: { page: 'outfit-summary' } })
      );
    };
    backBtn.addEventListener('click', handler);
    cleanupFns.push(() => backBtn.removeEventListener('click', handler));
  }
}

export function cleanupSaveCalendarPage() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
}
