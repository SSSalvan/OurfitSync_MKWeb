const wrap = document.getElementById("wrap");
const capsule = document.getElementById("capsule");
const panel = document.getElementById("panel");
const itemsContainer = document.getElementById("items");
const spotlight = document.getElementById("spotlight");
const items = Array.from(itemsContainer.querySelectorAll(".item"));

let SPOT_SIZE =
    parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--spot-size")
    ) || 62;

let open = false;
let activeIndex = -1;

function getDefaultActiveIndex() {
    const DEFAULT_TARGET = "home";

    const homeIndex = items.findIndex(
        (btn) => btn.dataset.target === DEFAULT_TARGET
    );

    if (homeIndex >= 0) return homeIndex;
    return 0;
}

function ensureActiveIndex() {
    if (activeIndex >= 0) return;
    activeIndex = getDefaultActiveIndex();
}

function moveSpotTo(index, animate = true) {
    if (index < 0 || index >= items.length) return;

    const item = items[index];
    activeIndex = index;

    items.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    const itemCenter = item.offsetTop + item.offsetHeight / 2;
    const newTop = itemCenter - SPOT_SIZE / 2;

    if (animate) {
        spotlight.style.transition = "top 420ms cubic-bezier(.2,.9,.2,1)";
        spotlight.style.transform = "translate(-50%, 0) scale(0.9)";
        void spotlight.offsetWidth;
        spotlight.style.top = `${newTop}px`;
        setTimeout(
            () => (spotlight.style.transform = "translate(-50%, 0) scale(1)"),
            120
        );
    } else {
        spotlight.style.transition = "none";
        spotlight.style.top = `${newTop}px`;
    }
}

function setOpenState(isOpen) {
    open = !!isOpen;
    capsule.classList.toggle("open", open);
    wrap.classList.toggle("active", open);

    if (open) {
        panel.classList.remove("hidden");

        setTimeout(() => {
            ensureActiveIndex();
            moveSpotTo(activeIndex, false);
            spotlight.style.opacity = 1;
        }, 50);
    } else {
        spotlight.style.opacity = 0;
        panel.classList.add("hidden");
    }
}

/* ==== EVENT LISTENERS ==== */

capsule.addEventListener("click", () => setOpenState(!open));

items.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
        const targetPage = btn.dataset.target;
        moveSpotTo(idx, true);

        if (targetPage) {
            const navEvent = new CustomEvent("navigate", {
                detail: { page: targetPage },
            });
            window.dispatchEvent(navEvent);
        }
    });
});

window.addEventListener("load", () => {
    SPOT_SIZE =
        parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--spot-size")
        ) || SPOT_SIZE;

    setOpenState(false);
});

window.addEventListener("resize", () => {
    if (open && activeIndex >= 0) {
        moveSpotTo(activeIndex, false);
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpenState(false);
});

capsule.addEventListener("click", () => {
    capsule.classList.toggle("selected");
});