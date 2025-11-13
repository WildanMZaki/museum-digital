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

// ===== QUEST TRACKER =====
window.QuestTracker = {
  // Menghitung total materi dari DATA
  getTotalMaterials() {
    const data = window.DATA || {};
    return (
      (data.figures?.length || 0) +
      (data.kingdoms?.length || 0) +
      (data.artifacts?.length || 0)
    );
  },

  // Mendapatkan list materi yang sudah di-explore dari localStorage
  getExploredMaterials() {
    return window.store.get("exploredMaterials") || [];
  },

  // Menambahkan materi yang di-explore
  addExploredMaterial(id) {
    const explored = this.getExploredMaterials();
    if (!explored.includes(id)) {
      explored.push(id);
      window.store.set("exploredMaterials", explored);
    }
  },

  // Mendapatkan quiz yang sudah diselesaikan
  getCompletedQuizzes() {
    return window.store.get("completedQuizzes") || [];
  },

  // Menambahkan quiz yang diselesaikan
  addCompletedQuiz(id) {
    const completed = this.getCompletedQuizzes();
    if (!completed.includes(id)) {
      completed.push(id);
      window.store.set("completedQuizzes", completed);
    }
  },

  // Check apakah quiz sudah diselesaikan
  isQuizCompleted(id) {
    return this.getCompletedQuizzes().includes(id);
  },

  // Update progress quest di halaman content
  updateQuestProgress() {
    const explored = this.getExploredMaterials().length;
    const total = this.getTotalMaterials();
    const percentage = total > 0 ? Math.round((explored / total) * 100) : 0;

    const progressBar = document.getElementById("questProgress");
    const progressText = document.getElementById("questProgressText");

    if (progressBar) {
      progressBar.style.width = percentage + "%";
      if (progressText) {
        progressText.textContent = `${explored}/${total} materi`;
      } else {
        progressBar.textContent = `${explored}/${total} materi`;
      }
    }
  },
};

// ===== QUIZ HANDLER =====
window.QuizHandler = {
  currentQuiz: null,
  currentQuestionIndex: 0,
  score: 0,
  materialId: null,

  // Mulai quiz untuk materi tertentu
  startQuiz(materialId) {
    this.materialId = materialId;
    const quizData = window.QUIZ_DATA?.[materialId];

    if (!quizData || quizData.length === 0) {
      alert("Quiz belum tersedia untuk materi ini.");
      return;
    }

    // Ambil 1 pertanyaan secara acak
    const randomIndex = Math.floor(Math.random() * quizData.length);
    this.currentQuiz = [quizData[randomIndex]];
    this.currentQuestionIndex = 0;
    this.score = 0;

    this.showQuizModal();
  },

  // Tampilkan quiz dalam modal/panel
  showQuizModal() {
    const question = this.currentQuiz[this.currentQuestionIndex];
    const tourGuide = document.getElementById("tourGuide");

    if (!tourGuide) return;

    tourGuide.innerHTML = `
      <div class="tour-bubble">
        <div class="mb-2"><strong>Quiz Time! 🎯</strong></div>
        <div class="mb-3">${question.question}</div>
        <div class="d-grid gap-2">
          ${question.options
            .map(
              (opt, idx) => `
            <button class="btn btn-sm btn-outline-primary quiz-option" data-index="${idx}">
              ${opt}
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    // Event listener untuk pilihan jawaban
    document.querySelectorAll(".quiz-option").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const selectedIndex = parseInt(e.target.dataset.index);
        this.checkAnswer(selectedIndex);
      });
    });
  },

  // Check jawaban
  checkAnswer(selectedIndex) {
    const question = this.currentQuiz[this.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct;

    if (isCorrect) {
      this.score++;
      this.showResult(true);
    } else {
      this.showResult(false);
    }
  },

  // Tampilkan hasil
  showResult(isCorrect) {
    const tourGuide = document.getElementById("tourGuide");

    tourGuide.innerHTML = `
      <div class="tour-bubble">
        <div class="mb-3 text-center">
          ${
            isCorrect
              ? '<div class="text-success fs-1">✓</div><div>Benar! 🎉</div>'
              : '<div class="text-danger fs-1">✗</div><div>Kurang tepat 😊</div>'
          }
        </div>
        <div class="text-center">
          <button class="btn btn-sm btn-success" id="finishQuizBtn">Selesai</button>
        </div>
      </div>
    `;

    document.getElementById("finishQuizBtn").addEventListener("click", () => {
      this.finishQuiz();
    });
  },

  // Selesaikan quiz
  finishQuiz() {
    // Simpan quiz sebagai completed
    window.QuestTracker.addCompletedQuiz(this.materialId);

    // Reset tour guide
    const tourGuide = document.getElementById("tourGuide");
    tourGuide.innerHTML = `
      <div class="tour-bubble">
        <span id="tourText">Quiz selesai! Lanjut eksplor materi lain ya 🚀</span>
      </div>
      <button class="btn btn-sm btn-warning mt-2" id="tourQuizBtn">Quiz Materi</button>
    `;

    // Re-attach event listener
    document.getElementById("tourQuizBtn").addEventListener("click", () => {
      window.QuizHandler.startQuiz(this.materialId);
    });

    // Update quest progress
    window.QuestTracker.updateQuestProgress();
  },
};
