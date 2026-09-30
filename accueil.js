"use strict";

/* Chiffres clés de l'accueil : lus depuis les données chargées par app.js,
   puis affichés avec un compteur animé. */
(function () {

  const fmt = n => Math.round(n).toLocaleString("fr-FR");

  function animate(id, target, suffix) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = performance.now(), dur = 1200;
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = fmt(target * eased) + (suffix ? "<small>" + suffix + "</small>" : "");
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  function isFunctional(s) {
    const t = String(s.statut_fonctionnement || "").toLowerCase();
    return t.includes("fonctionnel") && !t.includes("non");
  }

  function render(rows) {
    const students = rows.reduce((a, r) => a + (Number(r.effectif_total) || 0), 0);
    const communes = new Set(rows.map(r => r.commune).filter(Boolean)).size;
    const rate = rows.length ? (rows.filter(isFunctional).length * 100) / rows.length : 0;
    animate("hpSchools", rows.length);
    animate("hpStudents", students);
    animate("hpCommunes", communes);
    animate("hpRate", rate, "%");
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    const rows = window.STATE && window.STATE.raw;
    if (rows && rows.length) { clearInterval(timer); render(rows); }
    else if (tries > 80) { clearInterval(timer); }
  }, 400);

})();
