import { db, auth } from '../firebase-init.js';
import { collection, query, where, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { renderItemsToContainer } from '../utils/renderer.js';

// ----- UPDATE DATE & TIME (KODE ANDA - SUDAH BENAR) -----
function updateDateTime() {
  const dateElement = document.querySelector(".date-day span");
  if (dateElement) {
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dayName = days[now.getDay()];
    const month = months[now.getMonth()];
    const date = now.getDate();
    dateElement.innerHTML = `${dayName} <strong>${month} ${date}</strong> Today`;
  }
}

// ===== WEATHER (WeatherAPI.com) =====
const WEATHER_API_KEY = "810d424ddb294f039a4102022251111";
const WEATHER_API_URL = "https://api.weatherapi.com/v1/current.json";

async function fetchWeather(q) {
  const url = `${WEATHER_API_URL}?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
    q
  )}&aqi=no`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API error");
  return res.json();
}

function updateWeather() {
  const weatherElement = document.getElementById("weather");
  if (!weatherElement) return;

  weatherElement.textContent = "Loading...";

  const updateUI = (data) => {
    const temp = Math.round(data.current.temp_c);
    const cond = data.current.condition.text.toLowerCase();

    let icon = "☀";
    if (cond.includes("cloud")) icon = "☁";
    else if (cond.includes("rain")) icon = "🌧";
    else if (cond.includes("storm") || cond.includes("thunder")) icon = "⛈";
    else if (cond.includes("snow") || cond.includes("sleet")) icon = "❄";
    else if (cond.includes("fog") || cond.includes("mist") || cond.includes("haze"))
      icon = "🌫";

    weatherElement.textContent = `${temp}°C ${icon}`;
  };

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchWeather(`${pos.coords.latitude},${pos.coords.longitude}`);
          updateUI(data);
        } catch {
          const fallback = await fetchWeather("Jakarta");
          updateUI(fallback);
        }
      },
      async () => {
        const fallback = await fetchWeather("Jakarta");
        updateUI(fallback);
      }
    );
  } else {
    fetchWeather("Jakarta").then(updateUI).catch(() => {
      weatherElement.textContent = "—";
    });
  }
}

let homeListeners = [];

function attachTopPicksListener(userId) {
  const q = query(
    collection(db, "wardrobeItems"),
    where("userId", "==", userId),
    where("isLiked", "==", true),
    limit(10)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderItemsToContainer(items, 'top-picks-container', 'top-picks-empty');
  }, (error) => {
    console.error("Error fetching Top Picks: ", error);
  });
  homeListeners.push(unsubscribe);
}

function attachRecentlyAddedListener(userId) {
  const q = query(
    collection(db, "wardrobeItems"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(10)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderItemsToContainer(items, 'recently-added-container', 'recently-added-empty');
  }, (error) => {
    console.error("Error fetching Recently Added: ", error);
  });
  homeListeners.push(unsubscribe);
}

export function initHomePage() {
  const currentUser = auth.currentUser;
  if (currentUser) {
    attachTopPicksListener(currentUser.uid);
    attachRecentlyAddedListener(currentUser.uid);
    updateDateTime();
    updateWeather();
  }
  const calendarBtn = document.getElementById('home-calendar-btn');
  if (calendarBtn) {
    calendarBtn.addEventListener('click', () => {
      // if your app uses loadPage (typical in this project)
      if (window.loadPage) {
        window.loadPage('calendar');
      } else {
        // fallback: custom navigate event
        window.dispatchEvent(
          new CustomEvent('navigate', { detail: { page: 'calendar' } })
        );
      }
    });
  }  
}

export function cleanupHomePage() {
  homeListeners.forEach(unsubscribe => unsubscribe());
  homeListeners = [];
}