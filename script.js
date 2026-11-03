/* Presentation controller: navigation, galleries, theme, and image fallback */
const deck = document.querySelector(".deck");
const slides = [...deck.querySelectorAll(".slide")];
const dotsEl = document.querySelector(".dots");
const progress = document.querySelector(".progress");
const counter = document.querySelector(".counter");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const themeBtn = document.getElementById("themeBtn");
const root = document.documentElement;
let current = 0;
let typingRun = 0;

function positionSlideScripts() {
  slides.slice(1, -1).forEach((slide) => {
    const script = slide.querySelector(":scope > .script");
    const heading = slide.querySelector(".slide__inner h1, .slide__inner h2");
    if (script && heading) heading.insertAdjacentElement("afterend", script);
  });
}

function animateOpeningTitle() {
  const run = ++typingRun;
  const lines = [...document.querySelectorAll(".typing-line")];
  lines.forEach((line) => {
    line.querySelector(".typing-cursor")?.remove();
    line.textContent = "";
  });

  let lineIndex = 0;
  let characterIndex = 0;
  const cursor = document.createElement("span");
  cursor.className = "typing-cursor";
  const typeNext = () => {
    if (run !== typingRun || lineIndex >= lines.length) return;
    const line = lines[lineIndex];
    const text = line.dataset.text || "";
    line.textContent = text.slice(0, characterIndex + 1);
    line.append(cursor);
    characterIndex += 1;
    if (characterIndex < text.length) {
      window.setTimeout(typeNext, 130);
      return;
    }
    lineIndex += 1;
    characterIndex = 0;
    if (lineIndex < lines.length) lines[lineIndex].append(cursor);
    else {
      cursor.remove();
      window.setTimeout(() => animateOpeningTitle(), 1400);
    }
    typeNext();
  };
  lines[0].append(cursor);
  typeNext();
}

function setupGalleries() {
  document.querySelectorAll("[data-gallery]").forEach((box) => {
    const images = box.dataset.gallery.split(",").map((name) => name.trim()).filter(Boolean);
    if (images.length < 2) return;
    let index = 0;
    const img = box.querySelector("img");
    img.addEventListener("load", () => box.classList.remove("is-missing"));
    const controls = document.createElement("div");
    controls.className = "gallery-controls";
    const previous = document.createElement("button");
    const next = document.createElement("button");
    previous.type = "button";
    next.type = "button";
    previous.textContent = "←";
    next.textContent = "→";
    previous.setAttribute("aria-label", "Previous image");
    next.setAttribute("aria-label", "Next image");
    const showImage = (nextIndex) => {
      index = (nextIndex + images.length) % images.length;
      img.src = `assets/${images[index]}`;
    };
    previous.addEventListener("click", () => showImage(index - 1));
    next.addEventListener("click", () => showImage(index + 1));
    controls.append(previous, next);
    box.append(controls);
  });
}

/* ---- Navigation ---- */
slides.forEach((slide, i) => {
  const dot = document.createElement("button");
  dot.setAttribute("aria-label", `Go to slide ${i + 1}: ${slide.dataset.title}`);
  dot.addEventListener("click", () => goTo(i));
  dotsEl.appendChild(dot);
});

function goTo(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, i) => {
    slide.classList.toggle("is-active", i === current);
    slide.classList.toggle("is-past", i < current);
    slide.scrollTop = 0;
  });
  [...dotsEl.children].forEach((d, i) => d.classList.toggle("is-active", i === current));
  progress.style.width = `${((current + 1) / slides.length) * 100}%`;
  counter.textContent = `${current + 1} / ${slides.length}`;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
  if (current === 0) animateOpeningTitle();
  else typingRun += 1;
  history.replaceState(null, "", `#${current + 1}`);
}

prevBtn.addEventListener("click", () => goTo(current - 1));
nextBtn.addEventListener("click", () => goTo(current + 1));

document.addEventListener("keydown", (e) => {
  if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); goTo(current + 1); }
  else if (["ArrowLeft", "PageUp"].includes(e.key)) goTo(current - 1);
  else if (e.key === "Home") goTo(0);
  else if (e.key === "End") goTo(slides.length - 1);
});

let touchX = 0;
deck.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
deck.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 60) goTo(current + (dx < 0 ? 1 : -1));
});

/* ---- Theme ---- */
function setTheme(theme) {
  root.dataset.theme = theme;
  themeBtn.textContent = theme === "dark" ? "☾" : "☀";
  try { localStorage.setItem("presentation-theme", theme); } catch (_) {}
}
let saved = "light";
try { saved = localStorage.getItem("presentation-theme") || "light"; } catch (_) {}
setTheme(saved);
themeBtn.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

/* ---- Image fallback: show the expected file name if missing ---- */
document.querySelectorAll(".media").forEach((box) => {
  const img = box.querySelector("img");
  box.dataset.src = img.getAttribute("src");
  const markMissing = () => box.classList.add("is-missing");
  img.addEventListener("error", markMissing);
  if (img.complete && !img.naturalWidth) markMissing();
});

setupGalleries();
positionSlideScripts();
goTo((parseInt(location.hash.slice(1), 10) || 1) - 1);
