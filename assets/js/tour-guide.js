/* ===========================
   /assets/js/tour-guide.js
   (tidak berubah dari versi sebelumnya yang avatar persegi & interaktif)
   =========================== */
(function () {
  const state = {
    name: "MuseumBot",
    avatarSrc: "assets/image/tourguide.png",
    autoShow: true,
  };

  function ensureContainer() {
    let wrap = document.getElementById("tourToastWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "tourToastWrap";
      document.body.appendChild(wrap);
    }
    return wrap;
  }
  function resolveAvatar(src) {
    const img = new Image();
    img.src = src || state.avatarSrc;
    img.alt = state.name;
    img.onerror = function () {
      if (this.dataset.fbk) return;
      this.dataset.fbk = "1";
      this.src = "assets/img/tourguide.png";
    };
    return img;
  }
  function buildToast(html, opts) {
    const wrap = ensureContainer();
    const el = document.createElement("div");
    el.className = "toast tg-toast";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    el.innerHTML = html;
    wrap.appendChild(el);
    let inst = null;
    try {
      inst = new bootstrap.Toast(el, {
        autohide: opts?.autohide ?? true,
        delay: opts?.delay ?? 3000,
      });
      inst.show();
    } catch {
      el.classList.add("show");
      if (opts?.autohide !== false)
        setTimeout(() => {
          try {
            el.classList.remove("show");
            el.remove();
          } catch {}
        }, opts?.delay ?? 3000);
    }
    el.addEventListener("hidden.bs.toast", () => el.remove());
    return { el, inst };
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function toast(messageOrHtml, opts) {
    const treatAsHtml = !!opts?.html;
    const avatar = resolveAvatar(state.avatarSrc);
    const html = `
      <div class="toast-body">
        <div class="tg-row">
          <div class="tg-main">${
            treatAsHtml ? String(messageOrHtml) : escapeHtml(messageOrHtml)
          }</div>
          <div class="tg-avatar" aria-hidden="true"></div>
        </div>
      </div>`;
    const t = buildToast(html, opts);
    t.el.querySelector(".tg-avatar")?.appendChild(avatar);
    return t;
  }

  function toastInteractive(innerHtml, onClick, opts) {
    const avatar = resolveAvatar(state.avatarSrc);
    const closable = opts?.closable !== false; // default true
    const html = `
      <div class="toast-body tg-quiz">
        <div class="tg-row">
          <div class="tg-main">
            ${String(innerHtml)}
            ${
              closable
                ? `<div class="tg-actions text-end">
                <button type="button" class="btn btn-light btn-sm" data-bs-dismiss="toast">Tutup</button>
              </div>`
                : ``
            }
          </div>
          <div class="tg-avatar" aria-hidden="true"></div>
        </div>
      </div>`;
    const t = buildToast(html, { autohide: false, ...(opts || {}) });
    t.el.querySelector(".tg-avatar")?.appendChild(avatar);
    t.el.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.matches("[data-idx]")) {
        onClick?.(target);
        try {
          t.inst?.hide();
        } catch {}
        t.el.remove();
      }
    });
    return t;
  }

  window.TourGuide = {
    init(cfg) {
      if (cfg?.name) state.name = String(cfg.name);
      if (cfg?.avatarSrc) state.avatarSrc = String(cfg.avatarSrc);
      state.autoShow = cfg?.autoShow !== false;
      ensureContainer();
      return this;
    },
    toast,
    toastInteractive,
    say(m) {
      toast(m, { delay: 2500 });
    },
    open() {},
    close() {},
    toggle() {},
    setMessages() {},
  };
})();
