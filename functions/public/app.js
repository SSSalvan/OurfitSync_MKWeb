import { auth } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { loadUserData } from './utils/firestore.js';

const appRoot = document.getElementById('app-root');
const sidebarContainer = document.getElementById('sidebar-container');

let currentPageStyle = null;
let currentLayoutStyle = null;
let currentPageScript = null;
let currentCleanupFunction = () => {};

async function loadHtml(path, targetElement) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`File ${path} not found`);
        targetElement.innerHTML = await response.text();
    } catch (error) {
        console.error(error);
        targetElement.innerHTML = `<p>Error loading: ${path}</p>`;
    }
}

function loadScript(path, isModule = true) {
    if (currentPageScript) currentPageScript.remove();
    const script = document.createElement('script');
    script.src = path;
    if (isModule) script.type = 'module';
    script.id = 'page-script';
    document.body.appendChild(script);
    currentPageScript = script;
}

function removePageScript() {
    if (currentPageScript) {
        currentPageScript.remove();
        currentPageScript = null;
    }
}

function loadPersistentStyle(path) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = path;
    document.head.appendChild(link);
}

function loadLayoutStyle(layoutName) {
    if (currentLayoutStyle) currentLayoutStyle.remove();
    if (layoutName) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `page-style/${layoutName}.css`;
        document.head.appendChild(link);
        currentLayoutStyle = link;
    } else {
        currentLayoutStyle = null;
    }
}

function loadPageStyle(pageName) {
    if (currentPageStyle) currentPageStyle.remove();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `page-style/${pageName}.css`;
    document.head.appendChild(link);
    currentPageStyle = link;
}

window.loadPage = async (pageName) => {
    currentCleanupFunction();
    removePageScript();

    const authPages = ['login', 'signup', 'verify', 'verified'];
    if (authPages.includes(pageName)) {
        loadLayoutStyle('auth-layout');
        sidebarContainer.style.display = 'none';
    } else {
        loadLayoutStyle(null);
        sidebarContainer.style.display = 'block';
    }
    loadPageStyle(pageName);

    await loadHtml(`pages/${pageName}.html`, appRoot);

    const pagesNeedingData = ['home', 'profile'];
    if (pagesNeedingData.includes(pageName)) {
        const currentUser = auth.currentUser;
        if (currentUser) {
            await loadUserData(currentUser);
        }
    }

    initializePageEvents(pageName);
}

const toPascalCase = (s) => s.split('-').map(str => str.charAt(0).toUpperCase() + str.slice(1)).join('');

async function initializePageEvents(pageName) {
    currentCleanupFunction = () => {};

    try {
        if (pageName === 'landing') {
            setTimeout(() => { window.loadPage('login'); }, 2000);
            return;
        }

        const pagesWithLogic = [
            'login', 'signup', 'verify', 'verified', 'home', 'profile',
            'edit-profile', 'wardrobe', 'shuffle', 'calendar', 'create-outfit',
            'outfit-summary', 'save-calendar', 'edit-outfit', 'add-page'
        ];

        if (pagesWithLogic.includes(pageName)) {
            const capitalizedName = toPascalCase(pageName);
            const modulePath = `./page-logic/logic-${pageName}.js`;

            const module = await import(modulePath);

            const initFunc = `init${capitalizedName}Page`;
            const cleanupFunc = `cleanup${capitalizedName}Page`;

            if (module[initFunc]) {
                module[initFunc]();
            }

            currentCleanupFunction = module[cleanupFunc] || (() => {});
        }
    } catch (error) {
        console.error(error);
        currentCleanupFunction = () => {};
    }
}

async function initializeApp() {
    await loadHtml('components/sidebar.html', sidebarContainer);

    loadPersistentStyle('page-style/sidebar.css');
    loadScript('components/sidebar.js');

    window.addEventListener('navigate', (event) => {
        const pageName = event.detail.page;
        if (pageName) {
            window.loadPage(pageName);
        }
    });

    onAuthStateChanged(auth, async (user) => {
        currentCleanupFunction();

        if (user) {
            await user.reload();
            if (user.emailVerified) {
                const currentPage = appRoot.firstChild?.id;
                const authPages = ['login-page', 'signup-page', 'verify-page', 'verified-page', 'landing'];

                if (!currentPage || authPages.includes(currentPage)) {
                    await window.loadPage('home');
                } else {
                    const simplePageName = currentPage.replace('-page', '');
                    await window.loadPage(simplePageName);
                }
            } else {
                const currentPage = appRoot.firstChild?.id;
                if (currentPage !== 'verify-page') {
                    window.loadPage('verify');
                } else {
                    const verifyEmailText = document.getElementById('verify-email-text');
                    if (verifyEmailText && user) verifyEmailText.textContent = user.email;
                }
            }
        } else {
            window.loadPage('landing');
            sidebarContainer.style.display = 'none';
        }
    });
}

initializeApp();