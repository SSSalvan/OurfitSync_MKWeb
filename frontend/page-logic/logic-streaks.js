// page-logic/logic-streaks.js

export function initStreaksPage(params = {}) {
  const root = document.getElementById("streaks-page");
  if (!root) return;

  const weekEl = root.querySelector("#streaks-week");
  const countEl = root.querySelector("#streaks-count");
  const dayCountEl = root.querySelector("#streaks-day-count");
  const flameImg = root.querySelector(".streaks-flame-img");
  const backBtn = root.querySelector(".backBtn");

  if (!weekEl) return;
  const dayElems = weekEl.querySelectorAll(".streaks-day");

  // --- DOT HARI DALAM MINGGU (M–S) ---
  const jsDay = new Date().getDay(); // 0 = Sun, 1 = Mon, ...
  const todayIndex = (jsDay + 6) % 7; // 0 = Mon, 6 = Sun

  dayElems.forEach((dayEl) => {
    const idx = Number(dayEl.dataset.index);

    if (idx <= todayIndex) dayEl.classList.add("completed");
    else dayEl.classList.remove("completed");

    if (idx === todayIndex) dayEl.classList.add("today");
    else dayEl.classList.remove("today");
  });

  // --- LOGIN STREAK TOTAL (UNTUK ANGKA + ICON) ---
  let streakLength = Math.max(todayIndex + 1, 1);

  // kalau ada params.loginStreak dari app.js, pakai itu
  if (typeof params.loginStreak === "number") {
    streakLength = params.loginStreak;
  }

  if (countEl) countEl.textContent = streakLength;
  if (dayCountEl) dayCountEl.textContent = streakLength;

  // --- PILIH ICON BERDASARKAN WEEK ---
  if (flameImg) {
    let iconIndex = 1;

    if (streakLength >= 1 && streakLength <= 7) {
      iconIndex = 1;
    } else if (streakLength >= 8 && streakLength <= 15) {
      iconIndex = 2;
    } else if (streakLength >= 16 && streakLength <= 21) {
      iconIndex = 3;
    } else if (streakLength >= 22) {
      iconIndex = 4;
    }

    flameImg.src = `images/streaks-icon-${iconIndex}.png`;
  }

  // --- BACK BUTTON ---
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.loadPage) {
        window.loadPage("calendar");
      }
    });
  }
}

export function cleanupStreaksPage() {
  // Kalau nanti ada event listener yang perlu dibersihin, taruh di sini
}
