// ----------- Helper untuk baca URL Query ----------- //
function getQueryParam(param, defaultValue) {
  const params = new URLSearchParams(window.location.search);
  return params.has(param)
    ? decodeURIComponent(params.get(param))
    : defaultValue;
}

// Konfigurasi dari URL atau default
const YEARS_AGO = parseInt(getQueryParam("yearsAgo", "65"), 10);
const TARGET = getQueryParam("target", "materi.html");
console.log(TARGET);

const ANIMATION_DURATION = 7000;

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

let frame = 0;
let lastTime = startTime;

// Menggunakan easing untuk animasi speed up
function easeInQuint(t) {
  return t * t * t * t * t;
}

function runTimeTravelAnim(frames) {
  const start = startTime;
  const end = endTime;
  const duration = ANIMATION_DURATION;
  let startAnim = null;

  function animate(ts) {
    if (!startAnim) startAnim = ts;
    let elapsed = ts - startAnim;
    let progress = Math.min(elapsed / duration, 1);

    // Easing: dari lambat ke cepat
    let eased = easeInQuint(progress);
    let currentTime = start - (start - end) * eased;

    const dt = new Date(currentTime);
    dateEl.innerText = formatDate(dt);
    timeEl.innerText = formatTime(dt);

    // Optional: makin cepat, bisa trigger spark, background, dsb

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Redirect setelah animasi selesai
      window.location.href = TARGET;
    }
  }
  requestAnimationFrame(animate);
}

// Trigger animasi setelah 0.8 detik
setTimeout(() => {
  runTimeTravelAnim(60);
}, 1500);
