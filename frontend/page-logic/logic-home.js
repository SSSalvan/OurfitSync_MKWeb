
import { auth } from '../firebase-init.js'; 
import { fetchWardrobe } from '../utils/api.js'; 
import { renderItemsToContainer } from '../utils/renderer.js';

// ===== HELPER DARI API.JS =====
// Logika untuk memisahkan item berdasarkan `isLiked` dan `timestamp`
function processWardrobeData(items) {
    // Sort by timestamp for "Recently Added" (assuming timestamp is stored)
    const sortedItems = [...items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const recentlyAdded = sortedItems.slice(0, 10);
    const topPicks = items.filter(item => item.isLiked === true || item.isLiked === 'true').slice(0, 10);
    
    return { topPicks, recentlyAdded };
}

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

    let iconSrc = "images/sunny.png";

    if (cond.includes("cloud")) iconSrc = "images/cloudy.png";
    else if (cond.includes("rain")) iconSrc = "images/rainy.png";
    else if (cond.includes("storm") || cond.includes("thunder"))
      iconSrc = "images/storm.png";
    else if (cond.includes("snow") || cond.includes("sleet"))
      iconSrc = "images/snow.png";
    else if (cond.includes("fog") || cond.includes("mist") || cond.includes("haze"))
      iconSrc = "images/fog.png";

    // Update DOM
    weatherElement.innerHTML = `
      <span>${temp}°C</span>
      <img src="${iconSrc}" alt="weather icon" class="weather-icon">
    `;
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

let homeListeners = []; // Dikosongkan, tapi tetap dipertahankan untuk membersihkan event listeners non-API lainnya.

// --- FUNGSI BARU: LOAD DATA DARI VERCEL API ---
async function loadWardrobeData(userId) {
    try {
        const allItems = await fetchWardrobe(userId); // <-- Menggunakan API Vercel
        const { topPicks, recentlyAdded } = processWardrobeData(allItems);
        
        renderItemsToContainer(topPicks, 'top-picks-container', 'top-picks-empty');
        renderItemsToContainer(recentlyAdded, 'recently-added-container', 'recently-added-empty');

    } catch(error) {
        console.error("Failed to load Wardrobe data from API:", error);
        // Tampilkan pesan error jika gagal
        renderItemsToContainer([], 'top-picks-container', 'top-picks-empty');
        renderItemsToContainer([], 'recently-added-container', 'recently-added-empty');
    }
}


export function initHomePage() {
  const currentUser = auth.currentUser;
  if (currentUser) {
    // Diganti dengan panggilan API non-realtime
    loadWardrobeData(currentUser.uid); 
    
    updateDateTime();
    updateWeather();
  }
  const calendarBtn = document.getElementById('home-calendar-btn');
  if (calendarBtn) {
    calendarBtn.addEventListener('click', () => {
      if (window.loadPage) {
        window.loadPage('calendar');
      } else {
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