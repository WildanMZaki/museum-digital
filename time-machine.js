// ----------- Helper untuk baca URL Query ----------- //
function getQueryParam(param, defaultValue) {
  const params = new URLSearchParams(window.location.search);
  return params.has(param)
    ? decodeURIComponent(params.get(param))
    : defaultValue;
}

// Konfigurasi dari URL atau default
const YEARS_AGO = parseInt(getQueryParam("yearsAgo", "65"), 10);
const TARGET_RAW = getQueryParam("target", "materi.html");

// Rakit ulang URL redirect: gabungkan target + sisa params (mis. type, id)
function buildRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  // Ambil target dan buang param kontrol
  const target = params.get("target") || TARGET_RAW || "materi.html";
  params.delete("yearsAgo");
  params.delete("target");
  // Sisakan semua param lain (type, id, dll)
  const rest = params.toString();
  if (!rest) return target;
  return target + (target.includes("?") ? "&" : "?") + rest;
}

const TARGET = buildRedirectUrl();
const ANIMATION_DURATION = 8000;

// Helper format
function pad(num) {
  return num < 10 ? `0${num}` : num;
}
function formatDate(dt) {
  return `${pad(dt.getDate())} ${dt.toLocaleString("id-ID", {
    month: "long",
  })} ${dt.getFullYear()}`;
}
function formatTime(dt) {
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(
    dt.getSeconds()
  )}`;
}

// Set waktu awal
const now = new Date();
const dateEl = document.getElementById("date");
const timeEl = document.getElementById("time");
const yearsAgoEl = document.getElementById("yearsAgo");
yearsAgoEl.innerText = YEARS_AGO;

dateEl.innerText = formatDate(now);
timeEl.innerText = formatTime(now);

// Simulasi waktu mundur
let startTime = now.getTime();
let endTime = new Date(
  now.getFullYear() - YEARS_AGO,
  now.getMonth(),
  now.getDate(),
  now.getHours(),
  now.getMinutes(),
  now.getSeconds()
).getTime();

// Menggunakan easing untuk animasi speed up
function easeInQuint(t) {
  return t * t * t * t * t;
}

function runTimeTravelAnim() {
  const start = startTime;
  const end = endTime;
  const duration = ANIMATION_DURATION;
  let startAnim = null;

  function animate(ts) {
    if (!startAnim) startAnim = ts;
    const elapsed = ts - startAnim;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInQuint(progress);
    const currentTime = start - (start - end) * eased;

    const dt = new Date(currentTime);
    dateEl.innerText = formatDate(dt);
    timeEl.innerText = formatTime(dt);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Redirect setelah animasi selesai (URL sudah lengkap)
      window.location.href = TARGET;
    }
  }
  requestAnimationFrame(animate);
}

// Trigger animasi setelah 1.5 detik
setTimeout(() => {
  runTimeTravelAnim();
}, 1500);
