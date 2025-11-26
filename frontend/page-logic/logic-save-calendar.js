// ------------------------------------------------------------
// SAVE CALENDAR PAGE — UI-PERFECT VERSION
// ------------------------------------------------------------
import { auth } from "../firebase-init.js";

let currentYear;
let currentMonth;
let selectedDateISO = null;
let selectedTimeSlot = null;
let cleanupFns = [];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// Convert Sunday=0 to Monday=0
function getMondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

// ------------------------------------------------------------
// RENDER CALENDAR (matches CSS class names exactly)
// ------------------------------------------------------------
function renderCalendar() {
  const grid = document.getElementById("sc-calendar-days");
  if (!grid) return;

  grid.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1);
  const firstDayIndex = getMondayIndex(firstDay);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  for (let i = 0; i < 42; i++) {
    const btn = document.createElement("button");
    btn.className = "sc-day";

    let dayNum;
    let inMonth = false;

    if (i < firstDayIndex) {
      // previous month
      dayNum = daysInPrevMonth - firstDayIndex + 1 + i;
      btn.classList.add("sc-day--disabled");
    }
    else if (i >= firstDayIndex + daysInMonth) {
      // next month
      dayNum = i - (firstDayIndex + daysInMonth) + 1;
      btn.classList.add("sc-day--disabled");
    }
    else {
      // current month
      inMonth = true;
      dayNum = i - firstDayIndex + 1;
      btn.classList.add("sc-day--current");
    }

    btn.textContent = dayNum;

    if (inMonth) {
      const mm = String(currentMonth + 1).padStart(2, "0");
      const dd = String(dayNum).padStart(2, "0");
      const dateKey = `${currentYear}-${mm}-${dd}`;

      btn.dataset.date = dateKey;

      btn.addEventListener("click", () => {
        selectedDateISO = dateKey;
        updateSelectedDayHighlight();
      });
    } else {
      btn.disabled = true;
    }

    grid.appendChild(btn);
  }
}

// ------------------------------------------------------------
// UPDATE SELECTED DAY (correct class: .is-selected)
// ------------------------------------------------------------
function updateSelectedDayHighlight() {
  document.querySelectorAll(".sc-day").forEach(btn =>
    btn.classList.remove("is-selected")
  );

  if (selectedDateISO) {
    const btn = document.querySelector(`.sc-day[data-date="${selectedDateISO}"]`);
    if (btn) btn.classList.add("is-selected");
  }

  const lbl = document.getElementById("sc-month-label");
  if (lbl) lbl.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
}

// ------------------------------------------------------------
// MONTH NAV
// ------------------------------------------------------------
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
      updateSelectedDayHighlight();
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
      updateSelectedDayHighlight();
    };
    nextBtn.addEventListener("click", handler);
    cleanupFns.push(() => nextBtn.removeEventListener("click", handler));
  }
}

// ------------------------------------------------------------
// TIME BUTTONS (correct class: .is-selected)
// ------------------------------------------------------------
function setupTimeOptions() {
  const buttons = document.querySelectorAll(".sc-time-btn");

  buttons.forEach(btn => {
    const handler = () => {
      buttons.forEach(b => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");

      selectedTimeSlot = btn.dataset.slot; // morning / noon / afternoon / night
    };
    btn.addEventListener("click", handler);
    cleanupFns.push(() => btn.removeEventListener("click", handler));
  });
}

// ------------------------------------------------------------
// RETRIEVE OUTFIT SELECTION
// ------------------------------------------------------------
function getCurrentOutfitSelection() {
  try {
    const raw = sessionStorage.getItem("currentOutfitSelection");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ------------------------------------------------------------
// SAVE EVENT TO EXPRESS BACKEND
// ------------------------------------------------------------
async function saveEventToBackend() {
  const user = auth.currentUser;
  if (!user) return alert("Please log in first.");

  if (!selectedDateISO) return alert("Choose a date.");
  if (!selectedTimeSlot) return alert("Choose a time.");

  const occasion = document.getElementById("sc-occasion-input")?.value.trim() || "";
  const selection = getCurrentOutfitSelection();

  const map = { top: "Top", bottom: "Bottom", shoes: "Shoes", bag: "Bag" };
  const outfit = {};

  Object.keys(selection).forEach(key => {
    const cat = map[key];
    const item = selection[key];

    if (cat && item) {
      outfit[cat] = {
        category: cat,
        color: item.color || "",
        imageUrl: item.imageUrl || "",
        liked: false,
        style: item.style || ""
      };
    }
  });

  const payload = {
    userId: user.uid,
    date: selectedDateISO,
    time: selectedTimeSlot,
    occasion,
    outfit,
    timestamp: new Date().toISOString()
  };

  // FIX: GANTI DENGAN URL VERCEL ANDA
  const res = await fetch("https://ourfit-sync-mk-web.vercel.app/api/calendar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.error(await res.text());
    return alert("Failed to save.");
  }

  alert("Saved!");
  window.loadPage("calendar");
}

// ------------------------------------------------------------
// INIT PAGE
// ------------------------------------------------------------
export function initSaveCalendarPage() {
  const root = document.getElementById("save-calendar-page");
  if (!root) return;

  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  selectedDateISO = today.toISOString().slice(0, 10);

  renderCalendar();
  setupMonthNav();
  setupTimeOptions();
  updateSelectedDayHighlight();

  const saveBtn = document.getElementById("sc-save-btn");
  if (saveBtn) {
    const handler = () => saveEventToBackend();
    saveBtn.addEventListener("click", handler);
    cleanupFns.push(() => saveBtn.removeEventListener("click", handler));
  }

  const backBtn = document.querySelector(".backBtn");
  if (backBtn) {
    const handler = () => window.loadPage("outfit-summary");
    backBtn.addEventListener("click", handler);
    cleanupFns.push(() => backBtn.removeEventListener("click", handler));
  }
}

// ------------------------------------------------------------
export function cleanupSaveCalendarPage() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
}