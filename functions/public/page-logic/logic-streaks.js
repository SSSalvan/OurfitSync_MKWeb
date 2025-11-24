// page-logic/logic-streaks.js

// Contoh data dummy (bisa kamu ganti pakai API nanti)
const sampleStreakData = {
  currentStreak: 2,
  // index 0 = Senin, 1 = Selasa, ... 6 = Minggu
  daysActiveThisWeek: [0, 1],
};

export function initStreaksPage(params = {}) {
  const root = document.getElementById("streaks-page");
  if (!root) return;

  const backBtn = root.querySelector(".backBtn");
  const countEl = root.querySelector("#streaks-count");
  const dayCountEl = root.querySelector("#streaks-day-count");
  const weekEl = root.querySelector("#streaks-week");
  const titleEl = root.querySelector("#streaks-title");
  const subtitleEl = root.querySelector("#streaks-subtitle");

  // --- ambil data dari params kalau ada, kalau tidak pakai sample ---
  const data = {
    currentStreak: params.currentStreak ?? sampleStreakData.currentStreak,
    daysActiveThisWeek:
      params.daysActiveThisWeek ?? sampleStreakData.daysActiveThisWeek,
  };

  // update angka di flame & teks
  if (countEl) countEl.textContent = data.currentStreak || 0;
  if (dayCountEl) dayCountEl.textContent = data.currentStreak || 0;

  // optional: ubah teks sesuai streak
  if (titleEl && subtitleEl) {
    if (!data.currentStreak || data.currentStreak === 0) {
      titleEl.textContent = "Let's start your style streak!";
      subtitleEl.textContent = "Plan an outfit today to light the flame.";
    } else if (data.currentStreak < 4) {
      titleEl.textContent = "Keep Slaying Fashion Enthusiast!";
      subtitleEl.textContent = "You're starting the week in full fashion.";
    } else {
      titleEl.textContent = "On fire, Outfit Legend!";
      subtitleEl.textContent = "You've been styling consistently all week.";
    }
  }

  // set dot yang completed
  if (weekEl) {
    const dayElems = weekEl.querySelectorAll(".streaks-day");
    dayElems.forEach((dayEl) => {
      const idx = Number(dayEl.dataset.index);
      if (data.daysActiveThisWeek.includes(idx)) {
        dayEl.classList.add("completed");
      }
    });

    // optional: tandai hari ini
    const today = new Date();
    let jsDay = today.getDay(); // 0 = Sun, 1 = Mon, ...
    // convert ke index 0 = Mon, 6 = Sun
    const mondayIndex = (jsDay + 6) % 7;
    const todayEl = weekEl.querySelector(
      `.streaks-day[data-index="${mondayIndex}"]`
    );
    if (todayEl) todayEl.classList.add("today");
  }

  // back: balik ke calendar (kalau mau ke home, ganti 'calendar' -> 'home')
  if (backBtn) {
    const handler = () => {
      if (window.loadPage) {
        window.loadPage("calendar");
      } else {
        window.dispatchEvent(
          new CustomEvent("navigate", { detail: { page: "calendar" } })
        );
      }
    };
    backBtn.addEventListener("click", handler);

    // simpan di root supaya bisa dibersihkan
    root._streaksCleanup = () => backBtn.removeEventListener("click", handler);
  }
}

export function cleanupStreaksPage() {
  const root = document.getElementById("streaks-page");
  if (root && typeof root._streaksCleanup === "function") {
    root._streaksCleanup();
    root._streaksCleanup = null;
  }
}
