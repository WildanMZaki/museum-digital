// /assets/js/content-page.js
// Content Page Logic: toast-based guide & quiz + history localStorage
(() => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }

  function main() {
    // Enroll check
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

    // Utilities
    const qs = (k) =>
      typeof window.qs === "function"
        ? window.qs(k)
        : new URLSearchParams(window.location.search).get(k);
    const $ = (id) => document.getElementById(id);
    const safe = (v) => (v == null ? "" : String(v).trim());

    // Data
    const VALID_TYPES = new Set(["figure", "kingdom", "artifact"]);
    const rawType = safe(qs("type")).toLowerCase();
    const type = VALID_TYPES.has(rawType) ? rawType : "";
    const id = safe(qs("id"));
    const dataRoot = window.DATA || {};
    const pool =
      type && Array.isArray(dataRoot[`${type}s`]) ? dataRoot[`${type}s`] : [];
    const item = pool.find((x) => String(x?.id) === id);

    const titleEl = $("itemTitle"),
      sumEl = $("itemSummary"),
      imgEl = $("itemImage"),
      metaEl = $("itemMeta"),
      factsEl = $("factsList"),
      imageFrame = $("imageFrame");

    if (!item) {
      titleEl && (titleEl.textContent = "Konten tidak ditemukan");
      sumEl &&
        (sumEl.textContent =
          "Silakan kembali ke peta untuk memilih materi lainnya.");
      if (imgEl) imgEl.style.display = "none";
      if (imageFrame) imageFrame.style.display = "none";
      metaEl && (metaEl.textContent = "");
      factsEl && (factsEl.innerHTML = "");
      safeInitTour();
      window.TourGuide?.toast?.(
        "Konten tidak ditemukan. Kembali ke peta untuk memilih materi lain ya.",
        { delay: 3000 }
      );
      return;
    }

    // Title
    document.title = `${safe(item.title)} — Museum Digital`;

    // Tandai eksplor
    try {
      window.QuestTracker?.addExploredMaterial?.(id);
    } catch {}

    // Isi DOM
    titleEl && (titleEl.textContent = safe(item.title));
    sumEl && (sumEl.textContent = safe(item.summary || ""));
    if (imgEl) {
      const src = safe(item.image || "");
      if (src) {
        imgEl.src = src;
        imgEl.alt = safe(item.title || "Gambar");
        imgEl.onerror = function () {
          this.style.display = "none";
          if (imageFrame) imageFrame.style.display = "none";
        };
      } else {
        imgEl.style.display = "none";
        if (imageFrame) imageFrame.style.display = "none";
      }
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
      const frag = document.createDocumentFragment();
      for (const f of facts) {
        const li = document.createElement("li");
        li.textContent = safe(f);
        frag.appendChild(li);
      }
      factsEl.appendChild(frag);
    }

    // Progress + aria
    try {
      window.QuestTracker?.updateQuestProgress?.();
    } catch {}
    try {
      const bar = document.getElementById("questProgress");
      const wrap = bar?.closest(".progress");
      const text =
        document.getElementById("questProgressText")?.textContent || "";
      const m = text.match(/(\d+)\s*\/\s*(\d+)/);
      if (wrap && m) {
        const [done, total] = [parseInt(m[1], 10), parseInt(m[2], 10)];
        const pct = total ? Math.round((done / total) * 100) : 0;
        wrap.setAttribute("aria-valuenow", String(pct));
      }
    } catch {}

    // Tour init + sapaan via toast
    safeInitTour();
    const isQuizDone = safeIsQuizDone(id);
    window.TourGuide?.toast?.(
      isQuizDone
        ? "Quiz sudah selesai untuk materi ini! Lanjut ke materi lain ya 🎉"
        : "Halo, selamat menjelajah! Klik 'Quiz Materi' untuk mulai 🎯",
      { delay: 3500 }
    );

    // Quiz button -> toast-based quiz
    const sidebarQuizBtn = $("sidebarQuizBtn");
    if (sidebarQuizBtn) {
      sidebarQuizBtn.addEventListener("click", async () => {
        if (safeIsQuizDone(id)) {
          window.TourGuide?.toast?.("Kamu sudah menyelesaikan quiz ini. 🎉", {
            delay: 2500,
          });
          alert("Kamu sudah menyelesaikan quiz untuk materi ini! 🎉");
          return;
        }
        // Jika ada QuizHandler bawaan, tetap panggil (kompatibel), sambil toast
        let started = false;
        try {
          if (window.QuizHandler?.startQuiz) {
            window.TourGuide?.toast?.("Memulai quiz… semangat! 💪", {
              delay: 2000,
            });
            window.QuizHandler.startQuiz(id);
            started = true;
          }
        } catch {}
        // Fallback quiz via toast (pakai item.quiz bila tersedia)
        if (!started) {
          startToastQuizFallback({ itemId: id, item });
        }
      });
    }

    // ====== Utilities (quiz history & fallback) ======
    function readTicketId() {
      try {
        const raw = window.store?.get
          ? window.store.get("ticket")
          : JSON.parse(localStorage.getItem("ticket") || "null");
        return raw && raw.name && raw.school
          ? `${raw.name}|${raw.school}`
          : "guest";
      } catch {
        return "guest";
      }
    }
    function safeIsQuizDone(itemId) {
      try {
        const tId = readTicketId();
        const raw = JSON.parse(
          localStorage.getItem(`quizHistory:${tId}`) || "{}"
        );
        return !!raw?.[itemId]?.completed;
      } catch {
        return false;
      }
    }
    const QuizHistory = {
      getAll() {
        try {
          return JSON.parse(
            localStorage.getItem(`quizHistory:${readTicketId()}`) || "{}"
          );
        } catch {
          return {};
        }
      },
      save(itemId, payload) {
        try {
          const key = `quizHistory:${readTicketId()}`;
          const all = JSON.parse(localStorage.getItem(key) || "{}");
          all[itemId] = { ...(all[itemId] || {}), ...payload, ts: Date.now() };
          localStorage.setItem(key, JSON.stringify(all));
        } catch {}
      },
      clear(itemId) {
        try {
          const key = `quizHistory:${readTicketId()}`;
          const all = JSON.parse(localStorage.getItem(key) || "{}");
          delete all[itemId];
          localStorage.setItem(key, JSON.stringify(all));
        } catch {}
      },
    };

    function startToastQuizFallback({ itemId, item }) {
      const quiz = Array.isArray(item?.quiz) ? item.quiz : [];
      if (!quiz.length) {
        window.TourGuide?.toast?.(
          "Maaf, quiz belum tersedia untuk materi ini.",
          { delay: 2500 }
        );
        alert("Maaf, quiz belum bisa dimulai. Coba lagi nanti.");
        return;
      }
      window.TourGuide?.toast?.(`Quiz dimulai: ${item.title}`, { delay: 1500 });
      QuizHistory.clear(itemId);
      askQuestion(0);

      function askQuestion(i) {
        const q = quiz[i];
        if (!q) return finish();
        const choices = Array.isArray(q.choices) ? q.choices : [];
        const html = `
          <div class="fw-semibold mb-2">Q${i + 1}. ${q.q || "Pertanyaan"}</div>
          ${choices
            .map(
              (c, idx) => `
            <button type="button" class="btn btn-outline-primary btn-sm w-100 text-start mb-1" data-idx="${idx}">
              ${c}
            </button>
          `
            )
            .join("")}
        `;
        showToastInteractive(html, (btn) => {
          const idx = parseInt(btn.getAttribute("data-idx"), 10);
          const isCorrect =
            typeof q.answerIndex === "number" ? idx === q.answerIndex : null;
          QuizHistory.save(itemId, {
            answers: [
              ...(QuizHistory.getAll()?.[itemId]?.answers || []),
              { qid: q.id ?? i, idx, correct: isCorrect },
            ],
          });
          window.TourGuide?.toast?.(
            isCorrect === null
              ? "Jawaban disimpan."
              : isCorrect
              ? "Benar! 🎉"
              : "Kurang tepat.",
            { delay: 1000 }
          );
          askQuestion(i + 1);
        });
      }
      function finish() {
        QuizHistory.save(itemId, { completed: true });
        try {
          window.QuestTracker?.updateQuestProgress?.();
        } catch {}
        window.TourGuide?.toast?.(
          "Quiz selesai! Cek progresmu di panel kanan. 🎯",
          { delay: 3000 }
        );
        alert("Quiz selesai! 🎉");
      }
    }

    function showToastInteractive(innerHtml, onClick) {
      // buat toast custom dengan tombol pilihan
      const wrap = document.getElementById("tourToastWrap");
      if (!wrap) return;
      const el = document.createElement("div");
      el.className = "toast border-0 shadow";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-atomic", "true");
      el.innerHTML = `
        <div class="toast-body">
          ${innerHtml}
          <div class="mt-2 text-end">
            <button type="button" class="btn btn-light btn-sm" data-bs-dismiss="toast">Tutup</button>
          </div>
        </div>
      `;
      wrap.appendChild(el);
      let t;
      try {
        t = new bootstrap.Toast(el, { autohide: false });
        t.show();
      } catch {
        el.classList.add("show");
      }
      el.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (target.matches("[data-idx]")) {
          onClick?.(target);
          try {
            t?.hide();
          } catch {}
          el.remove();
        }
      });
      el.addEventListener("hidden.bs.toast", () => el.remove());
    }

    function safeInitTour() {
      try {
        if (!window.TourGuide?.init) throw new Error("TG missing");
        window.TourGuide.init({
          avatarSrc: window.TOUR_AVATAR_SRC || "assets/img/tourguide.png",
          name: "MuseumBot",
          autoShow: true,
        });
        if (!window.tourGuideSay)
          window.tourGuideSay = (m) => {
            try {
              window.TourGuide.say(m);
            } catch {}
          };
      } catch {
        if (!window.TourGuide)
          window.TourGuide = {
            init() {},
            say() {},
            setMessages() {},
            open() {},
            close() {},
            toggle() {},
            toast() {},
          };
        if (!window.tourGuideSay) window.tourGuideSay = function () {};
      }
    }
  }
})();
