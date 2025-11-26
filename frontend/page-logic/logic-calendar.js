// ---------------------------------------------
// CALENDAR PAGE — EXPRESS BACKEND VERSION (DIUBAH)
// ---------------------------------------------
import { auth } from "../firebase-init.js";
// --- BARU: Import fungsi API
import { fetchCalendarEvents } from "../utils/api.js"; 

let eventsByDate = {}; 
let cleanupFns = [];

// const API_BASE = "https://ourfit-sync-mk-web.vercel.app/api"; // <-- DIHAPUS

const timeIcons = {
  morning: "images/morning.png",
  noon: "images/noon.png",
  afternoon: "images/afternoon.png",
  night: "images/night.png",
  default: "images/morning.png",
};

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export function initCalendarPage() {
  const root = document.getElementById("calendar-page");
  if (!root) return;

  const grid = root.querySelector("#calendar-grid");
  const monthLabelEl = root.querySelector("#calendar-month-label");
  const monthSelectorEl = root.querySelector("#month-selector");
  const monthDropdownEl = root.querySelector("#month-dropdown");
  const eventsDateEl = root.querySelector("#events-date");
  const eventItemEl = root.querySelector("#event-item");
  const eventTextEl = root.querySelector("#event-text");
  const eventIconEl = root.querySelector("#event-icon");

  const today = new Date();
  const state = {
    year: today.getFullYear(),
    month: today.getMonth(),
    selectedDate: null,
  };

  // Back button
  const backBtn = root.querySelector(".backBtn");
  if (backBtn) {
    const handler = () => window.loadPage("home");
    backBtn.addEventListener("click", handler);
    cleanupFns.push(() => backBtn.removeEventListener("click", handler));
  }

  // ----------------------------------------------------
  // LOAD EVENTS DENGAN API.JS
  // ----------------------------------------------------
  async function loadEventsForMonth() {
    const user = auth.currentUser;
    if (!user) {
      eventsByDate = {};
      return;
    }

    try {
      // --- DIUBAH: Menggunakan fungsi terpusat dari api.js
      const data = await fetchCalendarEvents(user.uid); 

      const map = {};
      data.forEach(evt => {
        if (!map[evt.date]) map[evt.date] = [];
        map[evt.date].push(evt);
      });

      eventsByDate = map;
    } catch (err) {
      console.error("❌ Failed to load events:", err);
      eventsByDate = {}; 
    }
  }


  // ----------------------------------------------------
  // BUILD CALENDAR GRID
  // ----------------------------------------------------
  function buildCalendar() {
    const { year, month } = state;

    monthLabelEl.textContent = `${monthNames[month]} ${year}`;
    grid.innerHTML = "";

    const firstOfMonth = new Date(year, month, 1);
    const jsDay = firstOfMonth.getDay(); // Sun=0
    const firstDayIndex = (jsDay + 6) % 7; // Convert to Mon=0

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    for (let i = 0; i < 42; i++) {
      const cell = document.createElement("button");
      cell.className = "day-cell";

      let dayNumber;
      let inMonth = false;

      if (i < firstDayIndex) {
        dayNumber = daysInPrevMonth - firstDayIndex + 1 + i;
        cell.classList.add("other-month");
      } else if (i >= firstDayIndex + daysInMonth) {
        dayNumber = i - (firstDayIndex + daysInMonth) + 1;
        cell.classList.add("other-month");
      } else {
        dayNumber = i - firstDayIndex + 1;
        inMonth = true;
      }

      cell.innerHTML = `<span class="day-number">${dayNumber}</span>`;
      
      let dateString;
      if (inMonth) {
        const mm = String(month + 1).padStart(2, "0");
        const dd = String(dayNumber).padStart(2, "0");
        dateString = `${year}-${mm}-${dd}`;

        cell.dataset.date = dateString;
      } else {
        // Date strings for other months can be calculated, but often not needed
        dateString = null;
      }

      // Highlighting today
      if (
        inMonth &&
        year === today.getFullYear() &&
        month === today.getMonth() &&
        dayNumber === today.getDate()
      ) {
        cell.classList.add("today");
      }

      // Check for events
      if (inMonth && eventsByDate[dateString] && eventsByDate[dateString].length > 0) {
        cell.classList.add("has-event");
        cell.innerHTML += `<div class="event-dot"></div>`;
      }
      
      // Select Date Handler
      if (inMonth) {
        const handler = () => selectDate(dateString);
        cell.addEventListener("click", handler);
        cleanupFns.push(() => cell.removeEventListener("click", handler));
      }
      
      grid.appendChild(cell);
    }
    
    // Select today by default on initial load
    if (state.selectedDate === null) {
      const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const todayCell = root.querySelector(`.day-cell[data-date="${todayDateString}"]`);
      if (todayCell) {
        selectDate(todayDateString);
      } else {
        // Fallback for month view
        selectDate(null);
      }
    } else {
        // Re-select current date on month change
        selectDate(state.selectedDate, true);
    }
  }

  // ----------------------------------------------------
  // SELECT DATE
  // ----------------------------------------------------
  function selectDate(dateString, isRebuild = false) {
    eventsDateEl.textContent = "No Events";
    eventItemEl.style.display = "none";
    eventItemEl.style.cursor = "default";

    // Update state and active cell
    if (dateString) {
        state.selectedDate = dateString;
        eventsDateEl.textContent = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        
        // Remove active class from all cells
        if (!isRebuild) {
            root.querySelectorAll(".day-cell.selected").forEach(c => c.classList.remove("selected"));
        }
        
        // Add active class to the selected cell
        const selectedCell = root.querySelector(`.day-cell[data-date="${dateString}"]`);
        if (selectedCell) selectedCell.classList.add("selected");
    }

    // Load Events
    const events = eventsByDate[dateString] || [];

    // Clear previous event handler
    cleanupFns.forEach(fn => fn());
    cleanupFns = [];

    if (events.length === 0) {
      return;
    }

    const evt = events[0];
    eventTextEl.textContent = evt.occasion || "(No occasion)";
    eventIconEl.innerHTML = `<img src="${timeIcons[evt.time] || timeIcons.default}" />`;
    eventItemEl.style.display = "flex";
    eventItemEl.style.cursor = "pointer";

    const handler = () => window.loadPage("edit-outfit", { event: evt });
    eventItemEl.addEventListener("click", handler);
    cleanupFns.push(() => eventItemEl.removeEventListener("click", handler));
  }

  // ----------------------------------------------------
  // MONTH DROPDOWN
  // ----------------------------------------------------
  monthSelectorEl.addEventListener("click", () =>
    monthSelectorEl.classList.toggle("open")
  );

  document.addEventListener("click", (e) => {
    if (!monthSelectorEl.contains(e.target))
      monthSelectorEl.classList.remove("open");
  });

  monthNames.forEach((name, idx) => {
    const li = document.createElement("li");
    li.className = "month-option";
    li.textContent = name;

    li.addEventListener("click", async () => {
      state.month = idx;
      monthSelectorEl.classList.remove("open");
      await loadEventsForMonth();
      buildCalendar();
    });

    monthDropdownEl.appendChild(li);
  });


  // ----------------------------------------------------
  // INITIAL LOAD
  // ----------------------------------------------------
  (async () => {
    await loadEventsForMonth();
    buildCalendar();
  })();
}

export function cleanupCalendarPage() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
}