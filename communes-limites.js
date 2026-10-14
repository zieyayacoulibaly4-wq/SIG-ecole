"use strict";

/* =========================================================
   LIMITES DE COMMUNES — SIG Écoles de Bamako
   Quand une ou plusieurs communes sont cochées dans le filtre,
   leurs limites sont dessinées en premier plan sur la carte,
   et la carte se cadre dessus.

   Installation : ajouter dans index.html, APRÈS app.js :
     <script src="communes-limites.js"></script>

   Données : si le fichier "communes-bamako.geojson" existe à côté
   d'index.html, ses vrais contours sont utilisés. Sinon, un contour
   approximatif (enveloppe des écoles de la commune) est dessiné.
========================================================= */

(function () {

  const GEOJSON_URL = "communes-bamako.geojson";

  const STYLE_REAL = {
    pane: "communesPane",
    color: "#a8842a", weight: 4, opacity: 1,
    fillColor: "#d4af37", fillOpacity: 0.10
  };
  const STYLE_APPROX = Object.assign({}, STYLE_REAL, { dashArray: "10 8" });

  let boundaries = null;      // { "I": layer GeoJSON, ... } ou null
  let boundariesTried = false;
  let currentLayer = null;
  let paneReady = false;

  /* ---------- Clé de commune : "Commune III", "3", "III" -> "III" ---------- */

  const ROMANS = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI" };

  function communeKey(value) {
    const text = String(value ?? "").toUpperCase();
    const roman = text.match(/\b(VI|IV|V|III|II|I)\b/);
    if (roman) return roman[1];
    const digit = text.match(/\b([1-6])\b/);
    return digit ? ROMANS[digit[1]] : null;
  }

  /* ---------- Calque au-dessus des tuiles, sous les marqueurs ---------- */

  function ensurePane() {
    if (paneReady || !window.map) return;
    const pane = window.map.createPane("communesPane");
    pane.style.zIndex = 450;          // > fond de carte (200) et overlays (400)
    pane.style.pointerEvents = "none"; // les marqueurs restent cliquables
    paneReady = true;
  }

  /* ---------- Chargement optionnel des vrais contours ---------- */

  async function loadBoundaries() {
    if (boundariesTried) return boundaries;
    boundariesTried = true;
    try {
      const response = await fetch(GEOJSON_URL, { cache: "no-cache" });
      if (!response.ok) return null;
      const data = await response.json();
      const found = {};
      (data.features || []).forEach(feature => {
        const props = feature.properties || {};
        const label = Object.values(props).filter(v => typeof v === "string").join(" ");
        const match = label.match(/commune\s*(VI|IV|V|III|II|I|[1-6])\b/i);
        const key = match ? communeKey(match[1]) : null;
        if (key) { found[key] = feature; }
      });
      boundaries = Object.keys(found).length ? found : null;
    } catch (e) {
      boundaries = null;
    }
    return boundaries;
  }

  /* ---------- Contour approximatif : enveloppe convexe des écoles ---------- */

  function convexHull(points) {
    const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (pts.length < 3) return pts;
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [];
    pts.forEach(p => {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    });
    const upper = [];
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    upper.pop(); lower.pop();
    return lower.concat(upper);
  }

  function approximateOutline(key) {
    const points = STATE.raw
      .filter(s => communeKey(s.commune) === key)
      .map(s => [Number(s.latitude), Number(s.longitude)])
      .filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]));

    if (points.length < 3) return null;

    const hull = convexHull(points);
    const cLat = hull.reduce((a, p) => a + p[0], 0) / hull.length;
    const cLon = hull.reduce((a, p) => a + p[1], 0) / hull.length;

    // Agrandit légèrement le contour pour englober les écoles du bord
    const grown = hull.map(p => [cLat + (p[0] - cLat) * 1.12, cLon + (p[1] - cLon) * 1.12]);
    return L.polygon(grown, STYLE_APPROX);
  }

  /* ---------- Dessin des limites des communes cochées ---------- */

  async function drawSelectedCommunes() {

    if (!window.map || typeof L === "undefined" || !window.STATE) return;
    ensurePane();

    if (currentLayer) { window.map.removeLayer(currentLayer); currentLayer = null; }

    const keys = [...new Set((STATE.filters.commune || []).map(communeKey).filter(Boolean))];
    if (!keys.length) return;

    const real = await loadBoundaries();
    const group = L.featureGroup();

    keys.forEach(key => {
      if (real && real[key]) {
        L.geoJSON(real[key], { style: () => STYLE_REAL }).addTo(group);
      } else {
        const outline = approximateOutline(key);
        if (outline) { outline.addTo(group); }
      }
    });

    if (!group.getLayers().length) return;

    group.addTo(window.map);
    currentLayer = group;
    group.eachLayer(l => { if (l.bringToFront) l.bringToFront(); });

    const bounds = group.getBounds();
    if (bounds.isValid()) { window.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 }); }

  }

  /* ---------- Branchement sur les filtres ---------- */

  let installed = false;

  function install() {
    if (installed) return true;
    const originalApplyFilters = window.applyFilters;
    if (typeof originalApplyFilters !== "function") return false;
    window.applyFilters = function () {
      const result = originalApplyFilters.apply(this, arguments);
      drawSelectedCommunes();
      return result;
    };
    installed = true;
    console.info("communes-limites.js : actif.");
    return true;
  }

  // Cas normal : app.js est déjà chargé. Sinon (script placé dans le <head>),
  // on attend la fin du chargement de la page, avant l'initialisation de app.js.
  if (!install()) {
    document.addEventListener("DOMContentLoaded", () => {
      if (!install()) {
        console.warn("communes-limites.js : applyFilters introuvable (app.js non chargé ?).");
      }
    });
  }

})();
