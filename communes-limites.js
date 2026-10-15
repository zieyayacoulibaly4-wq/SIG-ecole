"use strict";

/* =========================================================
   LIMITES COMMUNES + QUARTIERS — SIG Écoles de Bamako
   - 6 communes en couleur, avec pastille numérotée
   - Survol : infobulle (écoles, élèves, % fonctionnelles)
   - Clic sur une commune / un quartier : active son filtre
   - Quand une commune est filtrée : ses quartiers s'affichent (traits fins)
   - Quand un quartier est filtré : il est mis en valeur avec son nom
   - Bouton (icône polygone) pour afficher / masquer les limites

   Fichiers à placer à côté d'index.html :
     communes_bamako.geojson
     quartiers_bamako.geojson
   À charger APRÈS app.js. Ouvrir via Live Server (http://).
========================================================= */

(function () {

  const COMMUNES_URL = "communes_bamako.geojson";
  const QUARTIERS_URL = "quartiers_bamako.geojson";

  // false = on garde le fond OpenStreetMap d'origine (défini dans app.js)
  // true  = on le remplace par le fond Esri ci-dessous
  const REPLACE_BASEMAP = false;

  // Fond Esri "World Street Map" : gratuit, sans clé, sans limites de quartiers OSM
  const BASEMAP_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

  const COLORS = {
    I: "#d4572b", II: "#2f8f6b", III: "#3d6fb6",
    IV: "#b8912e", V: "#8a4fa8", VI: "#c2385a"
  };

  const ROMANS = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI" };

  /* ---------- Clés de normalisation ---------- */

  function communeKey(value) {
    const text = String(value ?? "").toUpperCase();
    const roman = text.match(/\b(VI|IV|V|III|II|I)\b/);
    if (roman) return roman[1];
    const digit = text.match(/\b([1-6])\b/);
    return digit ? ROMANS[digit[1]] : null;
  }

  // "Baco Djicoroni" / "BACO  DJICORONI" / "Bamako_Coura" / "Badialan1" -> clé comparable
  function quartierKey(value) {
    let k = String(value ?? "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]/g, "");
    k = k.replace(/([a-z])([123])$/, (m, l, d) => l + ({ 1: "i", 2: "ii", 3: "iii" })[d]);
    return k;
  }

  /* ---------- Styles CSS ---------- */

  (function injectStyle() {
    const style = document.createElement("style");
    style.textContent = `
      .commune-path{transition:fill-opacity .2s ease, stroke-width .2s ease, stroke-opacity .2s ease;cursor:pointer;}

      .commune-label-wrap,.quartier-label-wrap{background:none!important;border:none!important;pointer-events:none;}
      .commune-label{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;
        width:26px;height:26px;border-radius:50%;background:var(--c);border:2px solid #fff;color:#fff;
        box-shadow:0 2px 8px rgba(20,15,5,.35);font:700 10.5px 'Space Grotesk','Inter',sans-serif;letter-spacing:.2px;
        transition:opacity .25s ease, transform .25s ease;}
      .commune-label.dim{opacity:.4;}
      .labels-hidden .commune-label{opacity:0;transform:translate(-50%,-50%) scale(.6);}

      .quartier-label{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;background:var(--c);color:#fff;
        border:2px solid #fff;border-radius:999px;padding:3px 10px;box-shadow:0 3px 10px rgba(20,15,5,.35);
        font:600 11px 'Space Grotesk','Inter',sans-serif;}

      .commune-tip{background:#fff!important;border:none!important;border-radius:12px!important;padding:10px 13px!important;
        box-shadow:0 12px 30px rgba(20,15,5,.28)!important;font-family:'Inter',sans-serif;color:#241f12;}
      .commune-tip::before{display:none!important;}
      .commune-tip .ct-title{display:flex;align-items:center;gap:8px;font:700 13.5px 'Space Grotesk',sans-serif;margin-bottom:7px;}
      .commune-tip .ct-dot{width:10px;height:10px;border-radius:50%;}
      .commune-tip .ct-row{display:flex;justify-content:space-between;gap:22px;font-size:12px;color:#5c5335;line-height:1.7;}
      .commune-tip .ct-row strong{color:#241f12;}
      .commune-tip .ct-hint{margin-top:6px;padding-top:6px;border-top:1px dashed #e6dcb8;font-size:10.5px;color:#9a8c5c;}

      .communes-toggle{display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:#fff;color:#9a8c5c;
        font-size:15px;text-decoration:none;cursor:pointer;}
      .communes-toggle.on{color:#b8912e;background:#fbf4dc;}
      .communes-toggle:hover{background:#f7f3e8;}
    `;
    document.head.appendChild(style);
  })();

  /* ---------- Données ---------- */

  let features = null;       // communes : { "I": feature }
  let qList = null;          // quartiers : [{ key, nom, commune, feature }]
  let layers = {};
  let group = null, labelGroup = null, qGroup = null, qLabelGroup = null;
  let visible = true;
  let busy = false, again = false;
  let controlAdded = false;
  let reported = false;

  async function loadFeatures() {
    if (features) return features;
    const response = await fetch(COMMUNES_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error("HTTP " + response.status + " sur " + COMMUNES_URL);
    const data = await response.json();
    features = {};
    (data.features || []).forEach(f => {
      const key = communeKey((f.properties || {}).commune);
      if (key) features[key] = f;
    });
    return features;
  }

  async function loadQuartiers() {
    if (qList) return qList;
    try {
      const response = await fetch(QUARTIERS_URL, { cache: "no-cache" });
      if (!response.ok) throw new Error("HTTP " + response.status + " sur " + QUARTIERS_URL);
      const data = await response.json();
      qList = (data.features || []).map(f => {
        const p = f.properties || {};
        return { key: quartierKey(p.nom), nom: p.nom || "", commune: communeKey(p.commune), feature: f };
      }).filter(q => q.key);
      console.info("[quartiers] " + qList.length + " contours chargés.");
    } catch (e) {
      console.warn("[quartiers] non chargés :", e.message || e);
      qList = [];
    }
    return qList;
  }

  /* ---------- Statistiques ---------- */

  const isFonct = s => {
    const st = String(s.statut_fonctionnement || "").toLowerCase();
    return st.includes("fonctionnel") && !st.includes("non");
  };

  function statsOf(rows) {
    const students = rows.reduce((a, s) => a + (Number(s.effectif_total) || 0), 0);
    const fonct = rows.filter(isFonct).length;
    return { schools: rows.length, students, rate: rows.length ? Math.round(fonct * 100 / rows.length) : 0 };
  }

  const fmt = n => Number(n).toLocaleString("fr-FR");
  const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function centroid(feature) {
    const g = feature.geometry;
    const ring = g.type === "MultiPolygon" ? g.coordinates[0][0] : g.coordinates[0];
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x1, y1] = ring[j], [x2, y2] = ring[i];
      const f = x1 * y2 - x2 * y1;
      a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
    }
    a *= 0.5;
    return [cy / (6 * a), cx / (6 * a)];
  }

  /* ---------- Styles ---------- */

  function styleFor(key, state) {
    const c = COLORS[key] || "#a8842a";
    const base = { color: c, fillColor: c, className: "commune-path", dashArray: null };
    if (state === "selected") return Object.assign(base, { weight: 3.5, opacity: 1, fillOpacity: 0.12 });
    if (state === "dim")      return Object.assign(base, { weight: 1.5, opacity: 0.35, fillOpacity: 0.02 });
    if (state === "hover")    return Object.assign(base, { weight: 3.5, opacity: 1, fillOpacity: 0.22 });
    return Object.assign(base, { weight: 2, opacity: 0.85, fillOpacity: 0.05 });
  }

  function styleQ(commune, state) {
    const c = COLORS[commune] || "#a8842a";
    const base = { color: c, fillColor: c, className: "commune-path", dashArray: null };
    if (state === "selected") return Object.assign(base, { weight: 3.5, opacity: 1, fillOpacity: 0.25 });
    if (state === "hover")    return Object.assign(base, { weight: 2.5, opacity: 1, fillOpacity: 0.16 });
    return Object.assign(base, { weight: 1.3, opacity: 0.8, fillOpacity: 0.03 });
  }

  const selectedCommunes = () =>
    [...new Set((window.STATE.filters.commune || []).map(communeKey).filter(Boolean))];

  const selectedQuartiers = () =>
    [...new Set((window.STATE.filters.quartier || []).map(quartierKey).filter(Boolean))];

  function stateOf(key, selected) {
    if (!selected.length) return "normal";
    return selected.includes(key) ? "selected" : "dim";
  }

  /* ---------- Clic : bascule des filtres ---------- */

  function applyFilterChange() {
    if (typeof window.refreshFilterOptions === "function") window.refreshFilterOptions();
    window.applyFilters();
  }

  function toggleCommuneFilter(key) {
    const S = window.STATE;
    const values = [...new Set(S.raw.map(s => s.commune))].filter(v => communeKey(v) === key);
    if (!values.length) return;
    const already = S.filters.commune.some(v => communeKey(v) === key);
    S.filters.commune = already
      ? S.filters.commune.filter(v => communeKey(v) !== key)
      : S.filters.commune.concat(values);
    applyFilterChange();
  }

  function toggleQuartierFilter(q) {
    const S = window.STATE;
    const values = [...new Set(S.raw.map(s => s.quartier))].filter(v => quartierKey(v) === q.key);
    if (!values.length) {
      if (typeof toast === "function") toast("Aucune école enregistrée dans le quartier " + q.nom + ".", "info");
      return;
    }
    const already = S.filters.quartier.some(v => quartierKey(v) === q.key);
    S.filters.quartier = already
      ? S.filters.quartier.filter(v => quartierKey(v) !== q.key)
      : S.filters.quartier.concat(values);
    applyFilterChange();
  }

  /* ---------- Quartiers ---------- */

  async function drawQuartiers(map, selCommunes) {

    if (qGroup) { map.removeLayer(qGroup); qGroup = null; }
    if (qLabelGroup) { map.removeLayer(qLabelGroup); qLabelGroup = null; }

    const selQ = selectedQuartiers();
    if (!selCommunes.length && !selQ.length) return [];

    const list = await loadQuartiers();
    if (!list.length) return [];

    // Diagnostic (une seule fois) : quartiers du CSV sans contour
    if (!reported) {
      reported = true;
      const known = new Set(list.map(q => q.key));
      const missing = [...new Set(window.STATE.raw.map(s => s.quartier).filter(Boolean))]
        .filter(v => !known.has(quartierKey(v)));
      if (missing.length) console.info("[quartiers] présents dans le CSV mais sans contour :", missing);
    }

    const counts = {};
    window.STATE.raw.forEach(s => {
      const k = quartierKey(s.quartier);
      (counts[k] = counts[k] || []).push(s);
    });

    qGroup = L.featureGroup();
    qLabelGroup = L.featureGroup();
    const selectedLayers = [];

    list.forEach(q => {

      const isSel = selQ.includes(q.key);
      if (!isSel && !selCommunes.includes(q.commune)) return;

      const st = statsOf(counts[q.key] || []);
      const layer = L.geoJSON(q.feature, { style: () => styleQ(q.commune, isSel ? "selected" : "normal") });

      layer.bindTooltip(
        `<div class="ct-title"><span class="ct-dot" style="background:${COLORS[q.commune] || "#a8842a"}"></span>${esc(q.nom)}</div>
         <div class="ct-row">Commune <strong>${esc(q.commune || "—")}</strong></div>
         <div class="ct-row">Écoles <strong>${fmt(st.schools)}</strong></div>
         <div class="ct-row">Élèves <strong>${fmt(st.students)}</strong></div>
         <div class="ct-hint">Cliquer pour filtrer</div>`,
        { sticky: true, className: "commune-tip", direction: "top", offset: [0, -8], opacity: 1 }
      );

      layer.on("mouseover", () => layer.setStyle(styleQ(q.commune, "hover")));
      layer.on("mouseout", () => layer.setStyle(styleQ(q.commune, isSel ? "selected" : "normal")));
      layer.on("click", e => { L.DomEvent.stopPropagation(e); toggleQuartierFilter(q); });

      layer.addTo(qGroup);

      if (isSel) {
        selectedLayers.push(layer);
        const [lat, lon] = centroid(q.feature);
        L.marker([lat, lon], {
          interactive: false, keyboard: false,
          icon: L.divIcon({
            className: "quartier-label-wrap", iconSize: [0, 0],
            html: `<div class="quartier-label" style="--c:${COLORS[q.commune] || "#a8842a"}">${esc(q.nom)}</div>`
          })
        }).addTo(qLabelGroup);
      }

    });

    qGroup.addTo(map);
    qLabelGroup.addTo(map);

    return selectedLayers;
  }

  /* ---------- Dessin principal ---------- */

  async function draw() {

    if (busy) { again = true; return; }
    busy = true;

    try {

      const map = window.map;
      if (!map || !window.STATE) return;

      if (group) { map.removeLayer(group); group = null; }
      if (labelGroup) { map.removeLayer(labelGroup); labelGroup = null; }
      if (qGroup) { map.removeLayer(qGroup); qGroup = null; }
      if (qLabelGroup) { map.removeLayer(qLabelGroup); qLabelGroup = null; }
      layers = {};

      addToggleControl(map);
      if (!visible) return;

      const all = await loadFeatures();
      const selected = selectedCommunes();

      group = L.featureGroup();
      labelGroup = L.featureGroup();

      Object.keys(all).forEach(key => {

        const rows = window.STATE.raw.filter(s => communeKey(s.commune) === key);
        const st = statsOf(rows);

        const layer = L.geoJSON(all[key], { style: () => styleFor(key, stateOf(key, selected)) });
        layers[key] = layer;

        layer.bindTooltip(
          `<div class="ct-title"><span class="ct-dot" style="background:${COLORS[key]}"></span>Commune ${key}</div>
           <div class="ct-row">Écoles <strong>${fmt(st.schools)}</strong></div>
           <div class="ct-row">Élèves <strong>${fmt(st.students)}</strong></div>
           <div class="ct-row">Fonctionnelles <strong>${st.rate}%</strong></div>
           <div class="ct-hint">Cliquer pour filtrer</div>`,
          { sticky: true, className: "commune-tip", direction: "top", offset: [0, -8], opacity: 1 }
        );

        layer.on("mouseover", () => layer.setStyle(styleFor(key, "hover")));
        layer.on("mouseout", () => layer.setStyle(styleFor(key, stateOf(key, selectedCommunes()))));
        layer.on("click", () => toggleCommuneFilter(key));

        layer.addTo(group);

        const [lat, lon] = centroid(all[key]);
        const dim = selected.length && !selected.includes(key) ? " dim" : "";
        L.marker([lat, lon], {
          interactive: false, keyboard: false,
          icon: L.divIcon({
            className: "commune-label-wrap", iconSize: [0, 0],
            html: `<div class="commune-label${dim}" style="--c:${COLORS[key]}">${key}</div>`
          })
        }).addTo(labelGroup);

      });

      group.addTo(map);
      labelGroup.addTo(map);
      group.eachLayer(l => l.bringToBack && l.bringToBack());

      updateLabelVisibility();

      const selectedQLayers = await drawQuartiers(map, selected);

      // Recadrage : quartiers filtrés en priorité, sinon communes filtrées
      const targets = selectedQLayers.length
        ? selectedQLayers
        : selected.map(k => layers[k]).filter(Boolean);

      if (targets.length) {
        const bounds = L.featureGroup(targets).getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [40, 40], maxZoom: selectedQLayers.length ? 16 : 15, duration: 0.8 });
        }
      }

    } catch (e) {
      console.error("[communes] ERREUR :", e);
    } finally {
      busy = false;
      if (again) { again = false; draw(); }
    }
  }

  function updateLabelVisibility() {
    const map = window.map;
    if (!map) return;
    map.getContainer().classList.toggle("labels-hidden", map.getZoom() >= 14);
  }

  /* ---------- Bouton afficher / masquer ---------- */

  function addToggleControl(map) {
    if (controlAdded) return;
    controlAdded = true;

    const Ctl = L.Control.extend({
      options: { position: "topright" },
      onAdd: function () {
        const box = L.DomUtil.create("div", "leaflet-bar");
        const a = L.DomUtil.create("a", "communes-toggle on", box);
        a.href = "#";
        a.title = "Afficher / masquer les limites (communes et quartiers)";
        a.innerHTML = '<i class="fa-solid fa-draw-polygon"></i>';
        L.DomEvent.disableClickPropagation(box);
        L.DomEvent.on(a, "click", e => {
          L.DomEvent.preventDefault(e);
          visible = !visible;
          a.classList.toggle("on", visible);
          draw();
        });
        return box;
      }
    });

    map.addControl(new Ctl());
    map.on("zoomend", updateLabelVisibility);
  }

  /* ---------- Fond de carte ---------- */

  function swapBasemap(map) {
    try {
      if (typeof baseLayerOSM === "undefined" || !baseLayerOSM) return;
      const wasOn = map.hasLayer(baseLayerOSM);
      const clean = L.tileLayer(BASEMAP_URL, { maxZoom: 19, attribution: "Tiles &copy; Esri" });
      if (wasOn) {
        map.removeLayer(baseLayerOSM);
        clean.addTo(map);
        clean.bringToBack();
      }
      baseLayerOSM = clean;
    } catch (e) {
      console.warn("[communes] fond de carte non remplacé :", e);
    }
  }

  /* ---------- Branchement sur les filtres ---------- */

  function install() {
    if (typeof window.applyFilters !== "function") return false;
    const original = window.applyFilters;
    window.applyFilters = function () {
      const r = original.apply(this, arguments);
      draw();
      return r;
    };
    return true;
  }

  if (!install()) {
    document.addEventListener("DOMContentLoaded", () => { install(); });
  }

  let tries = 0;
  const wait = setInterval(() => {
    tries++;
    if (window.map && window.STATE) { clearInterval(wait); if (REPLACE_BASEMAP) { swapBasemap(window.map); } draw(); }
    else if (tries > 50) { clearInterval(wait); }
  }, 200);

  window.drawCommunes = draw;

})();
