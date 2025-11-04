(function () {
  const map = L.map("map", { minZoom: 4, maxZoom: 10 }).setView([-2.5, 118], 5);
  window.mapRef = map;

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

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    {
      attribution: "&copy; OpenStreetMap & CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  const imgIcon = (url, size = 64) =>
    L.icon({
      iconUrl: url,
      iconSize: [size, size],
      className: "thumb-marker",
    });

  function popupHTML(item) {
    // Redirect to time-machine.html with query if Time Travel button clicked
    const url = `content.html?type=${item.type}&id=${item.id}`;
    const timeTravelUrl = `time-machine.html?yearsAgo=${
      new Date().getFullYear() - (item.year || 1500)
    }&target=content.html?type=${item.type}&id=${item.id}`;
    return `
      <div class="popup-card" style="width:220px">
        <img src="${item.image}" alt="${item.title}">
        <div class="mt-2">
          <strong>${item.title}</strong>
          <div class="text-muted small mb-2">~ ${item.year || "—"}</div>
          <p class="small mb-2">${item.summary || ""}</p>
          <div class="d-grid gap-2">
            <a class="btn btn-sm btn-primary" href="${url}">Lihat Detail</a>
            <a class="btn btn-sm btn-outline-secondary" href="${timeTravelUrl}">Time Machine</a>
          </div>
        </div>
      </div>
    `;
  }

  const layerFigures = L.layerGroup().addTo(map);
  const layerKingdoms = L.layerGroup().addTo(map);
  const layerArts = L.layerGroup().addTo(map);

  // function renderLayer(dataArr, layer, useCircle = false) {
  //   dataArr.forEach((item, idx) => {
  //     let marker;
  //     if (idx < 3 && item.image) {
  //       marker = L.marker([item.lat, item.lng], {
  //         icon: imgIcon(item.image, 64),
  //         title: item.title,
  //       });
  //     } else {
  //       marker = useCircle
  //         ? L.circleMarker([item.lat, item.lng], {
  //             radius: 6,
  //             color: "#c3a763",
  //             fillColor: "#efddb0",
  //             fillOpacity: 0.85,
  //           })
  //         : L.marker([item.lat, item.lng], { title: item.title });
  //     }
  //     marker.bindPopup(popupHTML(item));
  //     marker.addTo(layer);
  //   });
  // }

  function renderLayer(dataArr, layer, useCircle = false) {
    dataArr.forEach((item) => {
      let marker;
      // Beri gambar jika property image tersedia
      if (item.image) {
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

  const overlays = {
    "Wali Songo": layerFigures,
    Kingdoms: layerKingdoms,
    Artifacts: layerArts,
  };
  L.control.layers(null, overlays, { collapsed: false }).addTo(map);

  const groupAll = L.featureGroup([layerFigures, layerKingdoms, layerArts]);
  try {
    map.fitBounds(groupAll.getBounds(), { padding: [20, 20] });
  } catch (e) {}

  // Save layer reference for sidebar control
  window.__layers = { layerFigures, layerKingdoms, layerArts };
})();
