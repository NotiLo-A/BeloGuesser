const PANORAMA_LOCATIONS = [
  [53.900648, 27.559129],
  [53.934598, 27.559042],
  [53.872299, 27.49414],
  [53.944004, 30.349634],
  [53.901022, 30.275406],
  [53.835409, 30.377512],
  [52.135397, 23.61844],
  [52.055841, 23.721215],
  [52.104967, 23.790973],
  [55.204046, 30.166296],
  [55.155501, 30.219951],
  [55.20656, 30.266549],
  [52.423853, 30.961575],
  [52.465911, 31.009787],
  [52.421561, 31.011713],
];

ymaps.ready(function () {
  var lat = parseFloat(localStorage.getItem("gameStartLat"));
  var lon = parseFloat(localStorage.getItem("gameStartLon"));

  if (!lat || !lon) {
    const randomLocation =
      PANORAMA_LOCATIONS[Math.floor(Math.random() * PANORAMA_LOCATIONS.length)];
    lat = randomLocation[0];
    lon = randomLocation[1];
  }

  localStorage.setItem("actualLat", lat);
  localStorage.setItem("actualLon", lon);

  ymaps.panorama.locate([lat, lon]).then(function (panoramas) {
    if (panoramas.length > 0) {
      Object.getPrototypeOf(panoramas[0]).getMarkers = function () {
        return [];
      };

      new ymaps.panorama.Player("player", panoramas[0], {
        controls: [],
        suppressMapOpenBlock: true,
        suppressPanoramasControl: true,
      });

      var observer = new MutationObserver(function () {
        var ctrl = document.querySelector(".ymaps-2-1-79-panorama-control");
        if (ctrl) ctrl.remove();
      });

      observer.observe(document.getElementById("player"), {
        childList: true,
        subtree: true,
      });
    }
  });

  initMinimap();
});

function initMinimap() {
  const COUNTRY_CODE = "by";
  const MIN_ZOOM = 7;
  const MAX_ZOOM = 18;

  const tileLayers = {
    osm: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: MAX_ZOOM,
    }),
    satellite: L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "© Esri, Maxar, Earthstar Geographics",
        maxZoom: MAX_ZOOM,
      },
    ),
    hybrid: L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "© Esri",
        maxZoom: MAX_ZOOM,
      },
    ),
  };

  const labelsLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      opacity: 0.6,
      maxZoom: MAX_ZOOM,
    },
  );

  const map = L.map("minimap", {
    center: [53.7, 28.0],
    zoom: MIN_ZOOM,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    renderer: L.canvas(),
    zoomSnap: 0.5,
    zoomControl: false,
  });

  tileLayers.osm.addTo(map);

  window.setLayer = function (key) {
    document.querySelectorAll("#layer-switcher button").forEach((btn, i) => {
      btn.classList.toggle("active", ["osm", "satellite", "hybrid"][i] === key);
    });

    Object.values(tileLayers).forEach((l) => {
      if (map.hasLayer(l)) map.removeLayer(l);
    });
    if (map.hasLayer(labelsLayer)) map.removeLayer(labelsLayer);

    tileLayers[key].addTo(map);

    if (key === "hybrid") {
      labelsLayer.addTo(map);
      if (window._maskLayer) window._maskLayer.bringToFront();
      if (window._borderLayer) window._borderLayer.bringToFront();
    }
  };

  const WORLD_RING = [
    [-90, -180],
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180],
  ];
  const maskRenderer = L.canvas({ tolerance: 0, padding: 0.5 });

  function addMask(geometry) {
    const rings =
      geometry.type === "Polygon"
        ? [geometry.coordinates[0]]
        : geometry.coordinates.map((p) => p[0]);

    window._maskLayer = L.geoJSON(
      {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [WORLD_RING, ...rings] },
      },
      {
        renderer: maskRenderer,
        style: {
          fillColor: "#c0392b",
          fillOpacity: 0.65,
          stroke: false,
          interactive: false,
        },
      },
    ).addTo(map);

    window._borderLayer = L.geoJSON(
      { type: "Feature", geometry },
      {
        renderer: L.canvas({ tolerance: 0 }),
        style: {
          color: "#c0392b",
          weight: 2,
          fill: false,
          interactive: false,
        },
      },
    ).addTo(map);

    const bounds = L.geoJSON({ type: "Feature", geometry }).getBounds();
    map.fitBounds(bounds.pad(0.1));

    map.setMinZoom(map.getBoundsZoom(bounds) - 0.5);
    map.setMaxBounds(bounds.pad(0.15));
  }

  fetch(
    `https://nominatim.openstreetmap.org/search?country=${COUNTRY_CODE}&polygon_geojson=1&format=json&limit=1`,
    {
      headers: { "Accept-Language": "en" },
    },
  )
    .then((r) => r.json())
    .then((data) => {
      if (!data.length) throw new Error("Страна не найдена");
      addMask(data[0].geojson);
    })
    .catch((err) => console.error(err));

  const minimapContainer = document.getElementById("minimap-container");

  minimapContainer.addEventListener("mouseenter", function () {
    setTimeout(function () {
      map.invalidateSize({ animate: false });
    }, 300);
  });

  minimapContainer.addEventListener("mouseleave", function () {
    setTimeout(function () {
      map.invalidateSize({ animate: false });
    }, 300);
  });

  window._minimapInstance = map;

  let userMarker = null;

  map.on("click", function (e) {
    const latlng = e.latlng;

    if (userMarker) {
      userMarker.setLatLng(latlng);
    } else {
      userMarker = L.marker(latlng, {
        icon: L.icon({
          iconUrl:
            "data:image/svg+xml;base64," +
            btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
              <path fill="#3498db" stroke="#fff" stroke-width="2" d="M16 0C9.4 0 4 5.4 4 12c0 8 12 28 12 28s12-20 12-28c0-6.6-5.4-12-12-12z"/>
              <circle cx="16" cy="12" r="4" fill="#fff"/>
            </svg>
          `),
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
        }),
      }).addTo(map);
    }

    localStorage.setItem("guessLat", latlng.lat);
    localStorage.setItem("guessLon", latlng.lng);
  });

  document.getElementById("guessBtn").addEventListener("click", function () {
    const guessLat = localStorage.getItem("guessLat");
    const guessLon = localStorage.getItem("guessLon");

    if (!guessLat || !guessLon) {
      alert("Сначала поставьте метку на карте!");
      return;
    }

    window.location.href = "result.html";
  });
}
