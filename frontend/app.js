import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { loadUserData } from "./utils/firestore.js";

const appRoot = document.getElementById("app-root");
const sidebarContainer = document.getElementById("sidebar-container");

let currentPageStyle = null;
let currentLayoutStyle = null;
let currentPageScript = null;
let currentCleanupFunction = () => {};

/* ---------------------------------------
   LOAD HTML FILES
---------------------------------------- */
async function loadHtml(path, targetElement) {
  try {
    const response = await fetch(`./${path}`); // RELATIVE PATH FIXED
    if (!response.ok) throw new Error(`File ${path} not found`);
    targetElement.innerHTML = await response.text();
  } catch (error) {
    console.error(error);
    targetElement.innerHTML = `<p>Error loading: ${path}</p>`;
  }
}

/* ---------------------------------------
   LOAD SCRIPT (MODULE)
---------------------------------------- */
function loadScript(path, isModule = true) {
  removePageScript();
  const script = document.createElement("script");
  script.src = `./${path}`; // RELATIVE PATH FIXED
  if (isModule) script.type = "module";
  script.id = "page-script";
  document.body.appendChild(script);
  currentPageScript = script;
}

function removePageScript() {
  if (currentPageScript) {
    currentPageScript.remove();
    currentPageScript = null;
  }
}

/* ---------------------------------------
   STYLE LOADERS
---------------------------------------- */
function loadPersistentStyle(path) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `./${path}`; // FIXED
  document.head.appendChild(link);
}

function loadLayoutStyle(layoutName) {
  if (currentLayoutStyle) currentLayoutStyle.remove();

  if (layoutName) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `./page-style/${layoutName}.css`; // FIXED
    document.head.appendChild(link);
    currentLayoutStyle = link;
  }
}

function loadPageStyle(pageName) {
  if (currentPageStyle) currentPageStyle.remove();

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `./page-style/${pageName}.css`; // FIXED
  document.head.appendChild(link);
  currentPageStyle = link;
}

/* ---------------------------------------
   MAIN PAGE LOADER
---------------------------------------- */
window.loadPage = async (pageName, params = {}) => {
  currentCleanupFunction();
  removePageScript();

  const authPages = ["login", "signup", "verify", "verified", "landing"];

  if (authPages.includes(pageName)) {
    loadLayoutStyle("auth-layout");
    sidebarContainer.style.display = "none";
  } else {
    loadLayoutStyle(null);
    sidebarContainer.style.display = "block";
  }

  loadPageStyle(pageName);

  await loadHtml(`pages/${pageName}.html`, appRoot);

  const pagesNeedingData = ["home", "profile"];
  if (pagesNeedingData.includes(pageName)) {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await loadUserData(currentUser);
    }
  }

  initializePageEvents(pageName, params);
};

/* ---------------------------------------
   DYNAMIC PAGE LOGIC IMPORT
---------------------------------------- */
const toPascalCase = (s) =>
  s
    .split("-")
    .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
    .join("");

async function initializePageEvents(pageName, params = {}) {
  currentCleanupFunction = () => {};

  try {
    if (pageName === "landing") {
      setTimeout(() => window.loadPage("login"), 2000);
      return;
    }

    const pagesWithLogic = [
      "login",
      "signup",
      "verify",
      "verified",
      "home",
      "profile",
      "edit-profile",
      "wardrobe",
      "shuffle",
      "calendar",
      "create-outfit",
      "outfit-summary",
      "save-calendar",
      "edit-outfit",
      "add-page",
      "streaks",
    ];

    if (pagesWithLogic.includes(pageName)) {
      const capitalizedName = toPascalCase(pageName);

      const modulePath = `./page-logic/logic-${pageName}.js`; // FIXED

      const module = await import(modulePath);

      const initFunc = `init${capitalizedName}Page`;
      const cleanupFunc = `cleanup${capitalizedName}Page`;

      if (module[initFunc]) module[initFunc](params);

      currentCleanupFunction = module[cleanupFunc] || (() => {});
    }
  } catch (error) {
    console.error("Page logic load error:", error);
    currentCleanupFunction = () => {};
  }
}

/* ---------------------------------------
   APP INITIALIZER
---------------------------------------- */
async function initializeApp() {
  await loadHtml("components/sidebar.html", sidebarContainer);
  loadPersistentStyle("page-style/sidebar.css");
  loadScript("components/sidebar.js");

  window.addEventListener("navigate", (event) => {
    const pageName = event.detail.page;
    if (pageName) window.loadPage(pageName);
  });

  onAuthStateChanged(auth, async (user) => {
    currentCleanupFunction();

    if (user) {
      await user.reload();

      const pageId = appRoot.firstChild?.id;
      const authPages = [
        "login-page",
        "signup-page",
        "verify-page",
        "verified-page",
        "landing",
      ];

      if (user.emailVerified) {
        if (!pageId || authPages.includes(pageId)) {
          await window.loadPage("home");
        } else {
          const simplePageName = pageId.replace("-page", "");
          await window.loadPage(simplePageName);
        }
      } else {
        if (pageId !== "verify-page") {
          window.loadPage("verify");
        } else {
          const verifyEmailText = document.getElementById("verify-email-text");
          if (verifyEmailText) verifyEmailText.textContent = user.email;
        }
      }
    } else {
      window.loadPage("landing");
      sidebarContainer.style.display = "none";
    }
  });
}

initializeApp();
