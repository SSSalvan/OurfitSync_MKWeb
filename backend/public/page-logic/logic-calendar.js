// ---------------------------------------------
// CALENDAR PAGE — EXPRESS BACKEND VERSION
// ---------------------------------------------
import { auth } from "../firebase-init.js";

let eventsByDate = {}; 
let cleanupFns = [];

const API_BASE = "http://localhost:5050/api";

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
  // LOAD EVENTS FROM EXPRESS BACKEND
  // ----------------------------------------------------
  async function loadEventsForMonth() {
    console.log("FETCHING =", `${API_BASE}/calendar/user/${auth.currentUser?.uid}`);
    const user = auth.currentUser;
    if (!user) {
      eventsByDate = {};
      return;
    }

    let res;
    try {
      res = await fetch(`${API_BASE}/calendar/user/${user.uid}`);
    } catch (err) {
      console.error("❌ Failed to reach backend:", err);
      return;
    }

    if (!res.ok) {
      console.error("❌ Failed to load events:", await res.text());
      return;
    }

    const data = await res.json();

    const map = {};
    data.forEach(evt => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });

    eventsByDate = map;
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
        inMonth = true;
        dayNumber = i - firstDayIndex + 1;
      }

      const label = document.createElement("span");
      label.className = "day-number";
      label.textContent = dayNumber;

      const dayContent = document.createElement("div");
      dayContent.className = "day-content";
      dayContent.appendChild(label);

      let dateKey = null;
      let outfit = null;

      if (inMonth) {
        const yyyy = year;
        const mm = String(month + 1).padStart(2, "0");
        const dd = String(dayNumber).padStart(2, "0");
        dateKey = `${yyyy}-${mm}-${dd}`;
        cell.dataset.date = dateKey;

        const events = eventsByDate[dateKey];
        if (events && events.length > 0) outfit = events[0].outfit;
      }

      const thumbGrid = document.createElement("div");
      thumbGrid.className = "day-outfit-grid";

      const order = ["Top", "Bag", "Bottom", "Shoes"];
      order.forEach((cat) => {
        const slot = document.createElement("div");
        slot.className = "day-outfit-slot";

        if (outfit && outfit[cat] && outfit[cat].imageUrl) {
          const img = document.createElement("img");
          img.src = outfit[cat].imageUrl;
          img.className = "day-outfit-img";
          slot.appendChild(img);
        }
        thumbGrid.appendChild(slot);
      });

      dayContent.appendChild(thumbGrid);
      cell.appendChild(dayContent);

      if (inMonth) cell.addEventListener("click", () => handleDayClick(cell));

      grid.appendChild(cell);
    }

    eventsDateEl.textContent = "Select a date";
    eventItemEl.style.display = "none";
  }

  // ----------------------------------------------------
  // SELECT DAY
  // ----------------------------------------------------
  function clearSelected() {
    const prev = grid.querySelector(".day-highlighted");
    if (prev) prev.classList.remove("day-highlighted");
  }

  function handleDayClick(cell) {
    clearSelected();
    cell.classList.add("day-highlighted");

    const dateKey = cell.dataset.date;
    const [y, m, d] = dateKey.split("-").map(Number);

    eventsDateEl.textContent = `${d} ${monthNames[m - 1]} ${y}`;

    const events = eventsByDate[dateKey];

    if (!events || events.length === 0) {
      eventTextEl.textContent = "No event.";
      eventIconEl.innerHTML = "";
      eventItemEl.style.display = "flex";
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

  // INITIAL LOAD
  (async () => {
    await loadEventsForMonth();
    buildCalendar();
  })();
}

export function cleanupCalendarPage() {
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];
}
