// ===== Helpers =====
window.qs = (k) => new URLSearchParams(location.search).get(k);

window.store = {
  set(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
  },
  get(k) {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch (e) {
      return null;
    }
  },
  remove(k) {
    localStorage.removeItem(k);
  },
};

// ===== Time Machine (countdown ke tahun target) =====
window.timeMachine = (elId, targetYear) => {
  const el = document.getElementById(elId);
  if (!el || !targetYear) return;

  function render() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const diffYears = currentYear - targetYear; // misal 2025 - 1479 = 546 tahun
    const text =
      diffYears >= 0
        ? `Hari ini: ${currentYear} • Mundur ${diffYears} tahun ke ${targetYear}`
        : `Menuju masa depan: ${Math.abs(diffYears)} tahun ke ${targetYear}`;

    el.textContent = text;
  }
  render();
  setInterval(render, 1000); // sekadar animasi "hidup"
};

// ===== Share URL sederhana (WhatsApp) =====
window.shareWA = (title) => {
  const url = location.href;
  const text = encodeURIComponent(`${title} — ${url}`);
  window.open(`https://wa.me/?text=${text}`, "_blank");
};
