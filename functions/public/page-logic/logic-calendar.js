// ---------------------------------------------
// FIRESTORE CALENDAR VERSION (FINAL WORKING)
// ---------------------------------------------
import { db, auth } from "../firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let eventsByDate = {}; // { "2025-11-11": [event1, event2] }
let cleanupFns = [];

// Time → icon
const timeIcons = {
  Morning: 'images/morning.png',
  Noon: 'images/noon.png',
  Afternoon: 'images/afternoon.png',
  Night: 'images/night.png',
  default: 'images/morning.png'
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
    selectedDate: null
  };

    // Back button → go back to home
  const backBtn = root.querySelector(".backBtn");
  if (backBtn) {
    const handler = () => {
      if (window.loadPage) window.loadPage("home");
    };
    backBtn.addEventListener("click", handler);
    cleanupFns.push(() => backBtn.removeEventListener("click", handler));
  }

  // --------------------------
  // LOAD EVENTS FROM FIRESTORE
  // --------------------------
  async function loadEventsForMonth() {
    const user = auth.currentUser;
    if (!user) {
      eventsByDate = {};
      return;
    }

    const yyyy = state.year;
    const mm = String(state.month + 1).padStart(2, "0");

    const first = `${yyyy}-${mm}-01`;
    const lastDay = new Date(yyyy, state.month + 1, 0).getDate();
    const last = `${yyyy}-${mm}-${String(lastDay).padStart(2, "0")}`;

    const qRef = query(
      collection(db, "calendarEvents"),
      where("userId", "==", user.uid),
      where("date", ">=", first),
      where("date", "<=", last)
    );

    const snap = await getDocs(qRef);

    const map = {};
    snap.forEach((doc) => {
      const data = doc.data();
      const date = data.date;
      if (!map[date]) map[date] = [];
      map[date].push(data);
    });

    eventsByDate = map;
  }

  // --------------------------
  // BUILD CALENDAR GRID
  // --------------------------
  function buildCalendar() {
    const year = state.year;
    const month = state.month;

    // Update label
    monthLabelEl.textContent = `${monthNames[month]} ${year}`;

    // Clear grid
    grid.innerHTML = "";

    // Determine the grid layout
    const firstOfMonth = new Date(year, month, 1);
    const jsDay = firstOfMonth.getDay(); // Sun=0
    const firstDayIndex = (jsDay + 6) % 7; // convert to Mon=0

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const totalCells = 42;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement("button");
      cell.className = "day-cell";

      let dayNumber;
      let inMonth = false;

      if (i < firstDayIndex) {
        // previous month
        dayNumber = daysInPrevMonth - firstDayIndex + 1 + i;
        cell.classList.add("other-month");
      }
      else if (i >= firstDayIndex + daysInMonth) {
        // next month
        dayNumber = i - (firstDayIndex + daysInMonth) + 1;
        cell.classList.add("other-month");
      }
      else {
        inMonth = true;
        dayNumber = i - firstDayIndex + 1;
      }

      // Day number label
      const label = document.createElement("span");
      label.className = "day-number";
      label.textContent = dayNumber;

      // Container for [day number + 2×2 grid]
      const dayContent = document.createElement("div");
      dayContent.className = "day-content";
      dayContent.appendChild(label);

      let events = null;
      let outfit = null;
      let dateKey = null;

      if (inMonth) {
        const yyyy = year;
        const mm = String(month + 1).padStart(2, "0");
        const dd = String(dayNumber).padStart(2, "0");
        dateKey = `${yyyy}-${mm}-${dd}`;
        cell.dataset.date = dateKey;

        events = eventsByDate[dateKey];
        if (events && events.length > 0) {
          cell.classList.add("day-with-outfit");
          outfit = events[0].outfit || {};
        }
      }

      // 2×2 mini grid: always present (even if empty)
      const thumbGrid = document.createElement("div");
      thumbGrid.className = "day-outfit-grid";

      const order = ["Top", "Bag", "Bottom", "Shoes"];

      order.forEach((cat) => {
        const slot = document.createElement("div");
        slot.className = "day-outfit-slot";

        if (outfit && outfit[cat] && outfit[cat].imageUrl) {
          const img = document.createElement("img");
          img.src = outfit[cat].imageUrl;
          img.alt = cat;
          img.className = "day-outfit-img";
          slot.appendChild(img);
        }

        thumbGrid.appendChild(slot);
      });

      dayContent.appendChild(thumbGrid);
      cell.appendChild(dayContent);

      if (inMonth) {
        cell.addEventListener("click", () => handleDayClick(cell));
      }

      grid.appendChild(cell);
    }


    // Reset right panel
    eventsDateEl.textContent = "Select a date";
    eventItemEl.style.display = "none";
  }

  // --------------------------
  // HELPER: pick image from outfit
  // --------------------------
  function pickOutfitImage(outfit) {
    const keys = ["Top", "Bottom", "Shoes", "Bag"];
    for (let k of keys) {
      if (outfit[k] && outfit[k].imageUrl) {
        return outfit[k].imageUrl;
      }
    }
    return null;
  }

  // --------------------------
  // WHEN A DAY IS CLICKED
  // --------------------------
  function clearSelectedDay() {
    const prev = grid.querySelector(".day-highlighted");
    if (prev) {
      prev.classList.remove("day-highlighted");
    }
  }

  function handleDayClick(cell) {
    const dateKey = cell.dataset.date;
    clearSelectedDay();
    cell.classList.add("day-highlighted");

    const [y, m, d] = dateKey.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);

    state.selectedDate = dateObj;

    eventsDateEl.textContent = `${d} ${monthNames[m - 1]} ${y}`;

    const events = eventsByDate[dateKey];

    if (events && events.length > 0) {
      const event = events[0];

      eventTextEl.textContent = event.occasion || "(No occasion)";

      eventIconEl.innerHTML = `
        <img src="${timeIcons[event.time] || timeIcons.default}" 
            class="calendar-time-icon" />
      `;

      eventItemEl.style.display = "flex";
      eventItemEl.style.cursor = "pointer";

      // ---- NEW: CLICK TO EDIT OUTFIT ----
      const goToEdit = () => {
        if (window.loadPage) {
          window.loadPage("edit-outfit", { event });
        } else {
          window.dispatchEvent(
            new CustomEvent("navigate", {
              detail: { page: "edit-outfit", params: { event } }
            })
          );
        }
      };

      eventItemEl.addEventListener("click", goToEdit);

      cleanupFns.push(() => {
        eventItemEl.removeEventListener("click", goToEdit);
      });

    } else {
      // No event = just show blank card
      eventTextEl.textContent = "No event.";
      eventIconEl.innerHTML = "";
      eventItemEl.style.display = "flex";
      eventItemEl.style.cursor = "default";
    }

    
  }

  // --------------------------
  // MONTH DROPDOWN SETUP
  // --------------------------
  monthSelectorEl.addEventListener("click", () => {
    monthSelectorEl.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!monthSelectorEl.contains(e.target)) {
      monthSelectorEl.classList.remove("open");
    }
  });

  // Build dropdown
  monthNames.forEach((name, idx) => {
    const li = document.createElement("li");
    li.className = "month-option";
    li.textContent = name;

    li.addEventListener("click", () => {
      state.month = idx;
      monthSelectorEl.classList.remove("open");
      loadEventsAndRender();
    });

    monthDropdownEl.appendChild(li);
  });

  // --------------------------
  // INITIAL LOAD
  // --------------------------
  async function loadEventsAndRender() {
    await loadEventsForMonth();
    buildCalendar();
  }

  loadEventsAndRender();
}



export function cleanupCalendarPage() {
  cleanupFns.forEach(fn => fn());
  cleanupFns = [];
}
