import { auth } from '../firebase-init.js'; 
import { fetchWardrobe } from '../utils/api.js'; 
import { renderItemsToContainer } from '../utils/renderer.js';

// ===== HELPER DARI API.JS =====
function processWardrobeData(items) {
    const sortedItems = [...items].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt) : new Date(a.timestamp || 0);
        const timeB = b.createdAt ? new Date(b.createdAt) : new Date(b.timestamp || 0);
        return timeB - timeA;
    });
    
    const recentlyAdded = sortedItems.slice(0, 10);
    const topPicks = items.filter(item => item.isLiked === true || item.isLiked === 'true').slice(0, 10);
    
    return { topPicks, recentlyAdded };
}

// ----- UPDATE DATE & TIME =====
function updateDateTime() {
  const dateElement = document.querySelector(".date-day");
  if (dateElement) {
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dayName = days[now.getDay()];
    const month = months[now.getMonth()];
    const date = now.getDate();
    dateElement.textContent = dayName;
    
    const dateMain = document.querySelector(".date-main strong");
    if (dateMain) {
      dateMain.textContent = `${month} ${date}`;
    }
  }
}

// ===== WEATHER (WeatherAPI.com) =====
const WEATHER_API_KEY = "810d424ddb294f039a4102022251111";
const WEATHER_API_URL = "https://api.weatherapi.com/v1/current.json";

async function fetchWeather(q) {
  try {
    const url = `${WEATHER_API_URL}?key=${WEATHER_API_KEY}&q=${encodeURIComponent(q)}&aqi=no`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather API error");
    return await res.json();
  } catch (error) {
    console.error("Weather fetch error:", error);
    return null;
  }
}

function updateWeather() {
  const weatherElement = document.getElementById("weather");
  if (!weatherElement) return;

  weatherElement.textContent = "Loading...";

  const updateUI = (data) => {
    if (!data) {
      weatherElement.textContent = "—";
      return;
    }

    const temp = Math.round(data.current.temp_c);
    const cond = data.current.condition.text.toLowerCase();

    let iconSrc = "./images/sunny.png";

    if (cond.includes("cloud")) iconSrc = "./images/cloudy.png";
    else if (cond.includes("rain")) iconSrc = "./images/rainy.png";
    else if (cond.includes("storm") || cond.includes("thunder"))
      iconSrc = "./images/storm.png";
    else if (cond.includes("snow") || cond.includes("sleet"))
      iconSrc = "./images/snow.png";
    else if (cond.includes("fog") || cond.includes("mist") || cond.includes("haze"))
      iconSrc = "./images/fog.png";

    weatherElement.innerHTML = `
      <span>${temp}°C</span>
      <img src="${iconSrc}" alt="weather icon" class="weather-icon" onerror="this.style.display='none'">
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

let homeListeners = [];

// --- LOAD DATA DARI VERCEL API ---
async function loadWardrobeData(userId) {
    try {
        const allItems = await fetchWardrobe(userId);
        const { topPicks, recentlyAdded } = processWardrobeData(allItems);
        
        renderItemsToContainer(topPicks, 'top-picks-container', 'top-picks-empty');
        renderItemsToContainer(recentlyAdded, 'recently-added-container', 'recently-added-empty');

    } catch(error) {
        console.error("Failed to load Wardrobe data from API:", error);
        renderItemsToContainer([], 'top-picks-container', 'top-picks-empty');
        renderItemsToContainer([], 'recently-added-container', 'recently-added-empty');
    }
}

export function initHomePage() {
  const currentUser = auth.currentUser;
  if (currentUser) {
    loadWardrobeData(currentUser.uid);
    updateDateTime();
    updateWeather();
  }
  
  const calendarBtn = document.getElementById('home-calendar-btn');
  if (calendarBtn) {
    const handler = () => {
      if (window.loadPage) {
        window.loadPage('calendar');
      } else {
        window.dispatchEvent(
          new CustomEvent('navigate', { detail: { page: 'calendar' } })
        );
      }
    };
    calendarBtn.addEventListener('click', handler);
    homeListeners.push({ btn: calendarBtn, handler });
  }  
}

export function cleanupHomePage() {
  homeListeners.forEach(({ btn, handler }) => {
    btn.removeEventListener('click', handler);
  });
  homeListeners = [];
}