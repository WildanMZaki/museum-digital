(function () {
  const map = L.map("map", { minZoom: 4, maxZoom: 10 }).setView([-2.5, 118], 5);

  // setelah const map = L.map(...).setView(...)
  window.mapRef = map;

  // optional helper: fokus ke semua marker suatu region (gabung semua layer)
  window.fitByRegion = function (regionName) {
    const items = []
      .concat(window.DATA.figures || [])
      .concat(window.DATA.kingdoms || [])
      .concat(window.DATA.artifacts || [])
      .filter(
        (x) => (x.region || "").toLowerCase() === regionName.toLowerCase()
      );

    if (!items.length) return;

    const latlngs = items.map((x) => [x.lat, x.lng]);
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [20, 20] });
  };

  // Basemap tanpa label
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    {
      attribution: "&copy; OpenStreetMap & CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  // --- Helpers ---
  const imgIcon = (url, size = 64) =>
    L.icon({
      iconUrl: url,
      iconSize: [size, size],
      className: "thumb-marker",
    });

  function popupHTML(item) {
    const url = `content.html?type=${item.type}&id=${item.id}`;
    return `
      <div class="popup-card" style="width:220px">
        <img src="${item.image}" alt="${item.title}">
        <div class="mt-2">
          <strong>${item.title}</strong>
          <div class="text-muted small mb-2">~ ${item.year || "—"}</div>
          <p class="small mb-2">${item.summary || ""}</p>
          <div class="d-grid gap-2">
            <a class="btn btn-sm btn-primary" href="${url}">Lihat Detail</a>
            <button class="btn btn-sm btn-outline-secondary js-time-travel" data-type="${
              item.type
            }" data-id="${item.id}" data-year="${item.year || ""}">
              Time Travel
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // --- Layer Groups ---
  const layerFigures = L.layerGroup().addTo(map);
  const layerKingdoms = L.layerGroup().addTo(map);
  const layerArts = L.layerGroup().addTo(map);

  // Render: 2-3 pertama bergambar, sisanya pin/circle sederhana
  function renderLayer(dataArr, layer, useCircle = false) {
    dataArr.forEach((item, idx) => {
      let marker;
      if (idx < 3 && item.image) {
        marker = L.marker([item.lat, item.lng], {
          icon: imgIcon(item.image, 64),
          title: item.title,
        });
      } else {
        marker = useCircle
          ? L.circleMarker([item.lat, item.lng], { radius: 6 })
          : L.marker([item.lat, item.lng], { title: item.title });
      }
      marker.bindPopup(popupHTML(item));
      marker.addTo(layer);
    });
  }

  renderLayer(window.DATA.figures || [], layerFigures, false);
  renderLayer(window.DATA.kingdoms || [], layerKingdoms, false);
  renderLayer(window.DATA.artifacts || [], layerArts, true);

  // Layer control
  const overlays = {
    "Wali Songo": layerFigures,
    Kingdoms: layerKingdoms,
    Artifacts: layerArts,
  };
  L.control.layers(null, overlays, { collapsed: false }).addTo(map);

  // Fit bounds
  const groupAll = L.featureGroup([layerFigures, layerKingdoms, layerArts]);
  try {
    map.fitBounds(groupAll.getBounds(), { padding: [20, 20] });
  } catch (e) {}

  // Delegasi tombol Time Travel di popup
  map.on("popupopen", (e) => {
    const pop = e.popup.getElement();
    const btn = pop.querySelector(".js-time-travel");
    if (btn) {
      btn.addEventListener("click", () => {
        const type = btn.getAttribute("data-type");
        const id = btn.getAttribute("data-id");
        const year = parseInt(btn.getAttribute("data-year") || "1500", 10);
        openTimeMachine({ type, id, year });
      });
    }
  });

  // Expose untuk dropdown hint (opsional)
  window.__layers = { layerFigures, layerKingdoms, layerArts };
})();
