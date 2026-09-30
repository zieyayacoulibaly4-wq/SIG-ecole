"use strict";

/* Accueil : chiffres clés + fiche école, lus depuis les données chargées par app.js */
(function () {

  const fmt = n => Math.round(n).toLocaleString("fr-FR");
  const $ = id => document.getElementById(id);

  function animate(id, target) {
    const el = $(id);
    if (!el) return;
    const start = performance.now(), dur = 1200;
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  const status = s => String(s.statut_fonctionnement || "").toLowerCase();
  const isNon = s => status(s).includes("non") && status(s).includes("fonctionnel");
  const isOk = s => status(s).includes("fonctionnel") && !status(s).includes("non");

  function renderStats(rows) {
    animate("hmSchools", rows.length);
    animate("hmFonct", rows.filter(isOk).length);
    animate("hmNonFonct", rows.filter(isNon).length);
    animate("hmStudents", rows.reduce((a, r) => a + (Number(r.effectif_total) || 0), 0));
  }

  function commune(v) {
    return (typeof formatCommuneLabel === "function") ? formatCommuneLabel(v) : (v || "—");
  }

  function showSchool(s) {
    const card = $("hmSchool");
    if (!card || !s) return;
    $("hmSchName").textContent = s.nom_ecole || "École";
    $("hmSchType").textContent = s.type_ecole || "—";
    $("hmSchNiveau").textContent = s.niveau || "—";
    $("hmSchCommune").textContent = commune(s.commune);
    $("hmSchEff").textContent = fmt(Number(s.effectif_total) || 0) + " élèves";
    card.classList.remove("swap");
    void card.offsetWidth;
    card.classList.add("swap");
  }

  function startRotation(rows) {
    if (!rows.length) return;
    let i = Math.floor(Math.random() * rows.length);
    showSchool(rows[i]);
    if (rows.length > 1) {
      setInterval(() => { i = (i + 1) % rows.length; showSchool(rows[i]); }, 6000);
    }
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    const rows = window.STATE && window.STATE.raw;
    if (rows && rows.length) {
      clearInterval(timer);
      renderStats(rows);
      startRotation(rows);
    } else if (tries > 80) {
      clearInterval(timer);
    }
  }, 400);

})();

