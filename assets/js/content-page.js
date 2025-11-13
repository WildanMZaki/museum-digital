// ===== Museum Digital: Content Page Logic (DOM-fill only) =====
(() => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }

  function main() {
    // ---------- Enroll check (strict) ----------
    try {
      const safeGet = () => {
        if (window.store?.get) return window.store.get("ticket");
        const raw = localStorage.getItem("ticket");
        return raw ? JSON.parse(raw) : null;
      };
      const ticket = safeGet();
      if (!ticket || !ticket.name || !ticket.school) {
        window.location.replace("enroll.html?redirect=content");
        return;
      }
    } catch {
      window.location.replace("enroll.html?redirect=content");
      return;
    }

    // ---------- Utilities ----------
    const qs = (k) =>
      typeof window.qs === "function"
        ? window.qs(k)
        : new URLSearchParams(window.location.search).get(k);
    const $ = (id) => document.getElementById(id);
    const safe = (v) => (v == null ? "" : String(v));

    // ---------- Query & Data ----------
    const type = safe(qs("type")); // figure | kingdom | artifact
    const id = safe(qs("id"));
    const dataRoot = window.DATA || {};
    const pool = Array.isArray(dataRoot[`${type}s`])
      ? dataRoot[`${type}s`]
      : [];
    const item = pool.find((x) => String(x?.id) === id);

    const titleEl = $("itemTitle");
    const sumEl = $("itemSummary");
    const imgEl = $("itemImage");
    const metaEl = $("itemMeta");
    const factsEl = $("factsList");
    const upImgEl = $("upcomingImage");

    if (!item) {
      // Jika tidak ada item, tampilkan pesan sederhana
      if (titleEl) titleEl.textContent = "Konten tidak ditemukan";
      if (sumEl)
        sumEl.textContent =
          "Silakan kembali ke peta untuk memilih materi lainnya.";
      if (imgEl) imgEl.style.display = "none";
      if (metaEl) metaEl.textContent = "";
      if (factsEl) factsEl.innerHTML = "";
      return;
    }

    // ---------- Set document title ----------
    document.title = `${safe(item.title)} — Museum Digital`;

    // ---------- Tandai eksplor ----------
    try {
      window.QuestTracker?.addExploredMaterial?.(id);
    } catch {}

    // ---------- Isi DOM: teks & atribut ----------
    if (titleEl) titleEl.textContent = safe(item.title);
    if (sumEl) sumEl.textContent = safe(item.summary || "");
    if (imgEl) {
      imgEl.src = safe(item.image || "");
      imgEl.alt = safe(item.title || "Gambar");
      imgEl.onerror = function () {
        this.style.display = "none";
      };
    }
    if (metaEl) {
      const parts = [safe(item.year || ""), safe(item.region || "")].filter(
        Boolean
      );
      metaEl.textContent = parts.join(" • ");
    }

    if (factsEl) {
      factsEl.innerHTML = "";
      const facts = Array.isArray(item.facts) ? item.facts : [];
      facts.forEach((f) => {
        const li = document.createElement("li");
        li.textContent = safe(f);
        factsEl.appendChild(li);
      });
    }

    if (upImgEl) {
      upImgEl.src = safe(item.image || "");
      upImgEl.alt = safe(item.title || "Preview");
      upImgEl.onerror = function () {
        this.style.display = "none";
      };
    }

    // ---------- Progress ----------
    try {
      window.QuestTracker?.updateQuestProgress?.();
    } catch {}

    // ---------- Sidebar Quiz button ----------
    const sidebarQuizBtn = $("sidebarQuizBtn");
    if (sidebarQuizBtn) {
      sidebarQuizBtn.addEventListener("click", () => {
        let done = false;
        try {
          done = !!window.QuestTracker?.isQuizCompleted?.(id);
        } catch {}
        if (done) {
          alert("Kamu sudah menyelesaikan quiz untuk materi ini! 🎉");
          return;
        }
        try {
          window.QuizHandler?.startQuiz?.(id);
        } catch {
          alert("Maaf, quiz belum bisa dimulai. Coba lagi nanti.");
        }
      });
    }

    // ---------- Share (prefer shareWA, fallback WA/Web Share) ----------
    const shareBtn = $("shareBtn");
    if (shareBtn) {
      shareBtn.addEventListener("click", () => {
        const shareText = safe(item.title || "Materi Museum Digital");
        if (typeof window.shareWA === "function") {
          try {
            window.shareWA(shareText.replace(/'/g, ""));
            return;
          } catch {}
        }
        const url = location.href;
        const text = `${shareText} — ${url}`;
        if (navigator.share) {
          navigator.share({ title: shareText, text, url }).catch(() => {});
        } else {
          const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
          window.open(wa, "_blank", "noopener,noreferrer");
        }
      });
    }

    // ---------- Tour guide (dialog box, responsive) ----------
    const tourGuide = $("tourGuide");
    const tourMessages = $("tourMessages");
    const tourCloseBtn = $("tourCloseBtn");

    if (tourGuide && tourMessages) {
      // tampilkan
      tourGuide.classList.remove("d-none");

      let isQuizDone = false;
      try {
        isQuizDone = !!window.QuestTracker?.isQuizCompleted?.(id);
      } catch {}

      const messages = isQuizDone
        ? [
            "Quiz sudah selesai untuk materi ini! Lanjut ke materi lain ya 🎉",
            "Hebat! Kamu sudah menyelesaikan quiz ini. Eksplor lebih banyak!",
          ]
        : [
            "Halo, selamat menjelajah! Kapan pun siap quiz, klik tombol Quiz Materi di sidebar ya 🎯",
            "Butuh tantangan? Mulai quiz di panel kanan, aku siap menemani 😉",
            "Selesaikan quiz untuk membuka challenge quest yang seru!",
          ];

      // bersihkan dan append satu pesan acak ke dalam box dialog
      tourMessages.innerHTML = "";
      const msg = document.createElement("div");
      msg.className = "tour-msg";
      msg.textContent = messages[Math.floor(Math.random() * messages.length)];
      tourMessages.appendChild(msg);
    }

    if (tourCloseBtn && tourGuide) {
      tourCloseBtn.addEventListener("click", () => {
        tourGuide.classList.add("d-none");
      });
    }
  }
})();
