// Ambil data utama dari window.DATA
function getDataList(filter = "all") {
  let out = [];
  if (filter === "all" || filter === "figures")
    out = out.concat(
      window.DATA.figures.map((o) => ({ ...o, _cat: "figures" }))
    );
  if (filter === "all" || filter === "kingdoms")
    out = out.concat(
      window.DATA.kingdoms.map((o) => ({ ...o, _cat: "kingdoms" }))
    );
  if (filter === "all" || filter === "artifacts")
    out = out.concat(
      window.DATA.artifacts.map((o) => ({ ...o, _cat: "artifacts" }))
    );
  // Sorting: urut tahun terkecil ke besar
  out = out.sort((a, b) => (a.year || 0) - (b.year || 0));
  return out;
}

// Format Fungsi
function typeLabel(cat) {
  return cat === "figures"
    ? "Wali Songo"
    : cat === "kingdoms"
    ? "Kerajaan"
    : cat === "artifacts"
    ? "Artefak"
    : "";
}
function colorDot(cat) {
  return cat === "figures"
    ? "#9ccf7b"
    : cat === "kingdoms"
    ? "#4e97cb"
    : cat === "artifacts"
    ? "#f2be35"
    : "#d1b375";
}

// Render Timeline
function renderTimeline(filter = "all") {
  const timeline = document.getElementById("timeline");
  const items = getDataList(filter);

  timeline.innerHTML = "";
  items.forEach((item, idx) => {
    const el = document.createElement("div");
    el.className = "timeline-item";

    // Dot
    const dot = document.createElement("div");
    dot.className = "timeline-dot";
    dot.style.background = colorDot(item._cat);
    dot.style.borderColor = "#d1b375";
    el.appendChild(dot);

    // Card
    const card = document.createElement("div");
    card.className = "timeline-card";

    // Img
    if (item.image) {
      const img = document.createElement("img");
      img.className = "timeline-img";
      img.src = item.image;
      img.alt = item.title || item.id;
      card.appendChild(img);
    }

    // Card content
    const cc = document.createElement("div");
    const date = document.createElement("div");
    date.className = "timeline-date";
    date.innerText = item.year || "—";
    cc.appendChild(date);

    const type = document.createElement("div");
    type.className = "timeline-type mb-1";
    type.innerText = typeLabel(item._cat);
    type.style.color = colorDot(item._cat);
    type.style.fontWeight = "bold";
    type.style.fontSize = "0.99em";
    cc.appendChild(type);

    const title = document.createElement("div");
    title.className = "timeline-titlecard";
    title.innerText = item.title;
    cc.appendChild(title);

    const summary = document.createElement("div");
    summary.className = "timeline-summary";
    summary.innerText = item.summary || "";
    cc.appendChild(summary);

    if (item.facts && Array.isArray(item.facts)) {
      const facts = document.createElement("ul");
      facts.className = "timeline-facts";
      item.facts.forEach((fact) => {
        const li = document.createElement("li");
        li.innerText = fact;
        facts.appendChild(li);
      });
      cc.appendChild(facts);
    }

    // Link to detail page (optional)
    const goBtn = document.createElement("a");
    goBtn.className = "timeline-goto btn btn-sm";
    goBtn.innerText = "Lihat Detail";
    goBtn.href = `content.html?type=${item.type}&id=${item.id}`;
    cc.appendChild(goBtn);

    card.appendChild(cc);
    el.appendChild(card);
    timeline.appendChild(el);
    setTimeout(() => el.classList.add("visible"), 70 + idx * 40);
  });
}

// Filter navigation events
document.addEventListener("DOMContentLoaded", function () {
  renderTimeline("all");
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const filter = this.getAttribute("data-filter");
      renderTimeline(filter);
    });
  });
});
