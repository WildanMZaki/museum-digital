/* ======================================
   /assets/js/content-page.js  (UPDATED)
   ====================================== */
(() => {
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", main);
  else main();

  function main() {
    // --- Enroll check ---
    try {
      const safeGet = () =>
        window.store?.get
          ? window.store.get("ticket")
          : JSON.parse(localStorage.getItem("ticket") || "null");
      const ticket = safeGet();
      if (!ticket || !ticket.name || !ticket.school) {
        window.location.replace("enroll.html?redirect=content");
        return;
      }
    } catch {
      window.location.replace("enroll.html?redirect=content");
      return;
    }

    // --- Utils ---
    const qs = (k) =>
      typeof window.qs === "function"
        ? window.qs(k)
        : new URLSearchParams(window.location.search).get(k);
    const $ = (id) => document.getElementById(id);
    const safe = (v) => (v == null ? "" : String(v).trim());
    const esc = (s) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // --- Params & data ---
    const VALID_TYPES = new Set(["figure", "kingdom", "artifact"]);
    const rawType = safe(qs("type")).toLowerCase();
    const type = VALID_TYPES.has(rawType) ? rawType : "";
    const id = safe(qs("id"));
    const dataRoot = window.DATA || {};
    const pool =
      type && Array.isArray(dataRoot[`${type}s`]) ? dataRoot[`${type}s`] : [];
    const item = pool.find((x) => String(x?.id) === id);

    const titleEl = $("itemTitle");
    const sumEl = $("itemSummary");
    const imgEl = $("itemImage");
    const metaEl = $("itemMeta");
    const factsEl = $("factsList");
    const questPanel = $("questPanel");

    // --- TourGuide init ---
    try {
      window.TourGuide?.init({
        avatarSrc: window.TOUR_AVATAR_SRC || "assets/image/tourguide.png",
        name: "MuseumBot",
        autoShow: true,
      });
    } catch {}

    // --- Not found ---
    if (!item) {
      titleEl && (titleEl.textContent = "Konten tidak ditemukan");
      sumEl &&
        (sumEl.textContent =
          "Silakan kembali ke peta untuk memilih materi lainnya.");
      if (imgEl) imgEl.style.display = "none";
      metaEl && (metaEl.textContent = "");
      factsEl && (factsEl.innerHTML = "");
      window.TourGuide?.toast?.(
        "Konten tidak ditemukan. Kembali ke peta untuk memilih materi lain ya.",
        { delay: 3000 }
      );
      return;
    }

    // --- Title & explored ---
    document.title = `${safe(item.title)} — Museum Digital`;
    try {
      window.QuestTracker?.addExploredMaterial?.(id);
    } catch {}

    // --- Render content (HTML), hide summary ---
    titleEl && (titleEl.textContent = safe(item.title));
    if (sumEl) sumEl.style.display = "none"; // hide summary
    if (!document.getElementById("itemContent")) {
      const div = document.createElement("div");
      div.id = "itemContent";
      // NOTE: diasumsikan konten HTML aman/terkontrol dari data internal
      div.innerHTML = safe(item.content || "");
      sumEl?.insertAdjacentElement("afterend", div);
    } else {
      document.getElementById("itemContent").innerHTML = safe(
        item.content || ""
      );
    }

    // --- Image & meta ---
    if (imgEl) {
      const src = safe(item.image || "");
      if (src) {
        imgEl.src = src;
        imgEl.alt = safe(item.title || "Gambar");
        imgEl.onerror = function () {
          this.style.display = "none";
        };
      } else {
        imgEl.style.display = "none";
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

    // --- Progress + aria ---
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

    // --- Sapaan ---
    window.TourGuide?.toast?.(
      isQuizDone(id)
        ? "Quiz sudah selesai untuk materi ini! Lanjut ke materi lain ya 🎉"
        : "Halo, selamat menjelajah! Klik 'Quiz Materi' untuk mulai 🎯",
      { delay: 3500 }
    );

    // --- Render review jika sudah selesai ---
    if (isQuizDone(id)) renderQuizReview(id, { showHeader: true });

    // --- Quiz button → selalu toast interaktif ---
    const sidebarQuizBtn = $("sidebarQuizBtn");
    if (sidebarQuizBtn) {
      sidebarQuizBtn.addEventListener("click", () =>
        startToastQuiz({ itemId: id, type, item })
      );
    }

    // ====== Quiz History (per ticket) ======
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
    function getKey() {
      return `quizHistory:${readTicketId()}`;
    }
    function getAll() {
      try {
        return JSON.parse(localStorage.getItem(getKey()) || "{}");
      } catch {
        return {};
      }
    }
    function save(itemId, payload) {
      try {
        const key = getKey();
        const all = JSON.parse(localStorage.getItem(key) || "{}");
        all[itemId] = { ...(all[itemId] || {}), ...payload, ts: Date.now() };
        localStorage.setItem(key, JSON.stringify(all));
      } catch {}
    }
    function clear(itemId) {
      try {
        const key = getKey();
        const all = JSON.parse(localStorage.getItem(key) || "{}");
        delete all[itemId];
        localStorage.setItem(key, JSON.stringify(all));
      } catch {}
    }
    function isQuizDone(itemId) {
      try {
        return !!getAll()?.[itemId]?.completed;
      } catch {
        return false;
      }
    }

    // ====== QUIZ resolver + normalizer + limiter ======
    function resolveQuizData({ id, type, item }) {
      const qd = window.QUIZ_DATA || {};
      let raw = qd?.[id];
      if (!raw && type && qd?.[type]) raw = qd[type]?.[id];
      if (!raw) raw = item?.quiz; // fallback
      if (raw && !Array.isArray(raw) && Array.isArray(raw.questions))
        raw = raw.questions;
      const arr = Array.isArray(raw) ? raw : [];
      const normalized = arr.map((q, i) => {
        const text = q.q ?? q.question ?? "";
        const choices = Array.isArray(q.choices)
          ? q.choices
          : Array.isArray(q.options)
          ? q.options
          : [];
        const ans =
          typeof q.answerIndex === "number"
            ? q.answerIndex
            : typeof q.correct === "number"
            ? q.correct
            : typeof q.answer === "number"
            ? q.answer
            : null;
        return {
          id: q.id ?? i,
          q: String(text),
          choices: choices.map(String),
          answerIndex: ans,
        };
      });
      return normalized;
    }
    function takeUpTo(arr, n) {
      if (!Array.isArray(arr)) return [];
      if (arr.length <= n) return arr;
      // ambil 3 pertama (deterministik). Ubah ke random jika perlu.
      return arr.slice(0, n);
    }

    // ====== Toast Quiz ======
    function startToastQuiz({ itemId, type, item }) {
      let quiz = resolveQuizData({ id: itemId, type, item });
      if (quiz.length < 2) {
        window.TourGuide?.toast?.(
          "Maaf, quiz belum memadai untuk materi ini (butuh min. 2 soal).",
          { delay: 2500 }
        );
        return;
      }
      if (isQuizDone(itemId)) {
        window.TourGuide?.toast?.("Kamu sudah menyelesaikan quiz ini. 🎉", {
          delay: 2500,
        });
        renderQuizReview(itemId, { showHeader: true });
        return;
      }

      quiz = takeUpTo(quiz, 3);
      save(itemId, { meta: { total: quiz.length, title: item.title } }); // simpan meta
      window.TourGuide?.toast?.(
        `<b>Quiz dimulai:</b> ${esc(item.title)} ( ${quiz.length} soal )`,
        { delay: 1200, html: true }
      );
      clear(itemId); // reset sebelumnya
      save(itemId, { answers: [] });

      ask(0);

      function ask(i) {
        const q = quiz[i];
        if (!q) return finish();
        const html = `
          <div class="fw-semibold mb-2">Q${i + 1}/${quiz.length}. ${esc(
          q.q || "Pertanyaan"
        )}</div>
          ${
            q.choices.length
              ? q.choices
                  .map(
                    (c, idx) => `
                <button type="button" class="btn btn-outline-primary btn-sm w-100 text-start" data-idx="${idx}">
                  ${esc(c)}
                </button>`
                  )
                  .join("")
              : `<div class="text-muted">Tidak ada opsi.</div>
                 <button type="button" class="btn btn-primary btn-sm w-100 mt-2" data-idx="-1">Lanjut</button>`
          }`;
        window.TourGuide?.toastInteractive?.(
          html,
          (btn) => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            const correctIndex =
              typeof q.answerIndex === "number" ? q.answerIndex : null;
            const isCorrect =
              idx >= 0 && correctIndex !== null ? idx === correctIndex : null;
            const userText = idx >= 0 ? q.choices[idx] ?? "" : "";
            const correctText =
              correctIndex !== null ? q.choices[correctIndex] ?? "" : "";

            const store = getAll();
            const prev = store?.[itemId]?.answers || [];
            save(itemId, {
              answers: [
                ...prev,
                {
                  qid: q.id,
                  q: q.q,
                  idx,
                  userText,
                  correctIndex,
                  correctText,
                  correct: isCorrect,
                },
              ],
            });

            window.TourGuide?.toast?.(
              isCorrect === null
                ? "Jawaban disimpan."
                : isCorrect
                ? "Benar! 🎉"
                : "Kurang tepat.",
              { delay: 900 }
            );
            ask(i + 1);
          },
          { closable: false }
        );
      }

      function finish() {
        save(itemId, { completed: true });
        try {
          window.QuestTracker?.updateQuestProgress?.();
        } catch {}
        window.TourGuide?.toast?.(
          "Quiz selesai! Lihat kembali ringkasan jawaban anda. 🎯",
          { delay: 3000 }
        );
        renderQuizReview(itemId, { scrollIntoView: true, showHeader: true });
      }
    }

    // ====== Render quiz review under quest panel ======
    function renderQuizReview(itemId, opts = {}) {
      const data = getAll()?.[itemId];
      if (!data?.answers || !data.answers.length) return;
      const containerId = "quizReview";
      let host = document.getElementById(containerId);
      if (!host) {
        host = document.createElement("div");
        host.id = containerId;
        host.className = "card shadow-sm mb-3";
        questPanel?.insertAdjacentElement("afterend", host);
      }
      const answers = data.answers;
      const correctCount = answers.filter((a) => a.correct === true).length;
      const title = data?.meta?.title ? esc(data.meta.title) : "Quiz Materi";

      host.innerHTML = `
        <div class="card-body">
          ${
            opts.showHeader
              ? `<div class="d-flex justify-content-between align-items-center mb-2">
            <div><b>Ringkasan Quiz</b><div class="small text-muted">${title}</div></div>
            <span class="badge text-bg-${
              correctCount === answers.length ? "success" : "warning"
            }">
              Skor: ${correctCount}/${answers.length}
            </span>
          </div>`
              : ""
          }

          <ol class="mb-0">
            ${answers
              .map(
                (a, idx) => `
              <li class="mb-2">
                <div class="fw-semibold mb-1">${esc(
                  a.q || `Pertanyaan ${idx + 1}`
                )}</div>
                <div class="small">
                  Jawaban kamu: <span class="${
                    a.correct === true ? "text-success" : "text-danger"
                  }">${a.userText ? esc(a.userText) : "-"}</span><br>
                  Jawaban benar: <span class="text-success">${
                    a.correctText ? esc(a.correctText) : "-"
                  }</span>
                </div>
              </li>
            `
              )
              .join("")}
          </ol>
        </div>
      `;

      if (opts.scrollIntoView) {
        try {
          host.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch {}
      }
    }
  }
})();
