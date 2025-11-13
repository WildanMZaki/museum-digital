// /assets/js/report.js
// Rekap Kunjungan & Hasil Quiz (per ticket)
(() => {
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", main);
  else main();

  function main() {
    const ticket = getTicket();
    if (!ticket) {
      location.replace("enroll.html?redirect=report");
      return;
    }

    // Student meta
    document.getElementById(
      "studentMeta"
    ).textContent = `${ticket.name} — ${ticket.school}`;

    const dataRoot = window.DATA || {};
    const titles = buildTitleIndex(dataRoot); // id -> {title, typeLabel}

    const exploredIds = resolveExploredIds(ticket) || [];
    const quizMap = resolveQuizResults(ticket);

    const visitedUnion = unionUnique(exploredIds, Object.keys(quizMap || {}));

    const totalMaterials = totalCountMaterials(dataRoot);
    const exploredCount = visitedUnion.length;
    const { totalCorrect, totalAnswers, completedCount, perMaterial } =
      aggregateQuiz(quizMap);

    renderStats({
      exploredCount,
      totalMaterials,
      completedCount,
      totalCorrect,
      totalAnswers,
    });
    renderExploredTable(visitedUnion, titles);
    renderQuizTable(perMaterial, titles);

    document
      .getElementById("btnDownload")
      ?.addEventListener("click", downloadImage);
    document.getElementById("btnShare")?.addEventListener("click", shareImage);
  }

  // ===== Enroll & storage =====
  function getTicket() {
    try {
      if (window.store?.get) return window.store.get("ticket");
      const raw = localStorage.getItem("ticket");
      const t = raw ? JSON.parse(raw) : null;
      if (t && t.name && t.school) return t;
    } catch {}
    return null;
  }
  function ticketKey() {
    const t = getTicket();
    return t ? `${t.name}|${t.school}` : "guest";
  }

  // Map titles + localized type labels
  function buildTitleIndex(root) {
    const out = {};
    // type label mapping per request
    const labels = {
      figure: "Wali Songo",
      kingdom: "Kerajaan Islam",
      artifact: "Artefak",
    };
    [
      ["figures", "figure"],
      ["kingdoms", "kingdom"],
      ["artifacts", "artifact"],
    ].forEach(([k, type]) => {
      const arr = Array.isArray(root[k]) ? root[k] : [];
      arr.forEach((it) => {
        if (it?.id != null)
          out[String(it.id)] = {
            title: String(it.title || `(${labels[type]})`),
            typeLabel: labels[type],
          };
      });
    });
    return out;
  }

  function totalCountMaterials(root) {
    const a = (x) => (Array.isArray(root[x]) ? root[x].length : 0);
    return a("figures") + a("kingdoms") + a("artifacts");
  }

  function resolveExploredIds() {
    try {
      const ids = window.QuestTracker?.getExploredMaterialIds?.();
      if (Array.isArray(ids) && ids.length) return ids.map(String);
    } catch {}
    const candidates = [
      `exploredMaterials:${ticketKey()}`,
      "exploredMaterials",
      "quest:explored",
    ];
    for (const key of candidates) {
      try {
        const raw = JSON.parse(localStorage.getItem(key) || "null");
        if (Array.isArray(raw) && raw.length) return raw.map(String);
        if (raw && typeof raw === "object" && Array.isArray(raw.ids))
          return raw.ids.map(String);
      } catch {}
    }
    try {
      const q = resolveQuizResults();
      return Object.keys(q || {});
    } catch {}
    return [];
  }

  function resolveQuizResults() {
    try {
      const key = `quizHistory:${ticketKey()}`;
      const all = JSON.parse(localStorage.getItem(key) || "{}");
      return all && typeof all === "object" ? all : {};
    } catch {
      return {};
    }
  }

  function unionUnique(a1 = [], a2 = []) {
    const s = new Set([...a1.map(String), ...a2.map(String)]);
    return Array.from(s);
  }

  function aggregateQuiz(map) {
    let totalCorrect = 0,
      totalAnswers = 0,
      completedCount = 0;
    const perMaterial = [];
    for (const [id, rec] of Object.entries(map || {})) {
      const answers = Array.isArray(rec.answers) ? rec.answers : [];
      const correct = answers.filter((a) => a?.correct === true).length;
      const cnt = answers.length;
      totalCorrect += correct;
      totalAnswers += cnt;
      if (rec.completed) completedCount += 1;
      perMaterial.push({
        id,
        questions: cnt,
        correct,
        completed: !!rec.completed,
        meta: rec.meta || {},
      });
    }
    perMaterial.sort(
      (a, b) => (b.correct / b.questions || 0) - (a.correct / a.questions || 0)
    );
    return { totalCorrect, totalAnswers, completedCount, perMaterial };
  }

  // ===== Render =====
  function renderStats({
    exploredCount,
    totalMaterials,
    completedCount,
    totalCorrect,
    totalAnswers,
  }) {
    document.getElementById("statExplored").textContent = String(exploredCount);
    document.getElementById(
      "statExploredSub"
    ).textContent = `dari ${totalMaterials} materi`;

    document.getElementById("statQuizDone").textContent =
      String(completedCount);
    document.getElementById("statQuizDoneSub").textContent = `materi`;

    const pct = totalAnswers
      ? Math.round((totalCorrect / totalAnswers) * 100)
      : 0;
    document.getElementById("statAccuracy").textContent = `${pct}%`;
    document.getElementById(
      "statAccuracySub"
    ).textContent = `${totalCorrect} benar / ${totalAnswers} jawaban`;
  }

  function renderExploredTable(ids, titles) {
    const tbody = document.getElementById("exploredTbody");
    tbody.innerHTML = "";
    if (!ids.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-muted">Belum ada data eksplorasi.</td></tr>`;
      return;
    }
    ids.forEach((id, i) => {
      const meta = titles[id] || {};
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-muted">${i + 1}</td>
        <td>${escapeHtml(meta.title || id)}</td>
        <td><span class="badge rounded-pill bg-light text-dark">${escapeHtml(
          meta.typeLabel || "-"
        )}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderQuizTable(items, titles) {
    const tbody = document.getElementById("quizTbody");
    tbody.innerHTML = "";
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-muted">Belum ada quiz yang diselesaikan.</td></tr>`;
      return;
    }
    items.forEach((row, i) => {
      const meta = titles[row.id] || {};
      const score = row.questions ? `${row.correct}/${row.questions}` : "-";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-muted">${i + 1}</td>
        <td>${escapeHtml(row.meta.title || meta.title || row.id)}</td>
        <td>${row.questions}</td>
        <td>${row.correct}</td>
        <td><span class="badge ${badgeFor(row)}">${score}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function badgeFor(r) {
    if (!r.questions) return "text-bg-secondary";
    const pct = r.correct / r.questions;
    if (pct >= 0.8) return "text-bg-success";
    if (pct >= 0.5) return "text-bg-warning";
    return "text-bg-danger";
  }

  // ===== Export / Share =====
  async function downloadImage() {
    const card = document.getElementById("reportCard");
    const canvas = await html2canvas(card, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `rekap-museum-${Date.now()}.png`;
    a.click();
  }

  async function shareImage() {
    try {
      const originUrl =
        location.origin || location.protocol + "//" + location.host;
      const shareText = `Yuk jelajahi Museum Digital! Lihat rekap kunjunganku di sini. Akses: ${originUrl}`;
      // Jika device mendukung share file
      if (navigator.canShare && navigator.canShare({ files: [] })) {
        const card = document.getElementById("reportCard");
        const canvas = await html2canvas(card, {
          backgroundColor: "#ffffff",
          scale: 2,
        });
        const blob = await new Promise((res) =>
          canvas.toBlob(res, "image/png")
        );
        const file = new File([blob], `rekap-museum-${Date.now()}.png`, {
          type: "image/png",
        });
        await navigator.share({
          files: [file],
          title: "Rekap Kunjungan — Museum Digital",
          text: shareText,
        });
        return;
      }
      // Jika tidak bisa share file, coba share text+url
      if (navigator.share) {
        await navigator.share({
          title: "Rekap Kunjungan — Museum Digital",
          text: shareText,
          url: originUrl,
        });
        return;
      }
      // Fallback: download saja
      await downloadImage();
      alert(
        "Perangkat tidak mendukung Share API. Gambar telah diunduh, silakan bagikan secara manual."
      );
    } catch {
      // user cancel / tidak didukung → diamkan
    }
  }

  // ===== small utils =====
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
