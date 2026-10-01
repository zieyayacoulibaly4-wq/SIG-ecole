"use strict";

const SUPABASE_URL = "https://pbcnouwpiownvkbcucrm.supabase.co";
const SUPABASE_KEY = "sb_publishable_Uu_LTgMA9Y6CGPk4wR3wEQ_VCTdTU1b";
const TABLE = "ecoles";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = id => document.getElementById(id);

let pendingRows = [];
let pendingName = "";

/* ---------- Messages ---------- */
function say(id, text, type) {
  const el = $(id);
  el.textContent = text || "";
  el.className = "msg" + (type ? " " + type : "");
}

/* ---------- Vues ---------- */
function showLogin() {
  $("loginView").style.display = "";
  $("dashView").style.display = "none";
  $("btnLogout").style.display = "none";
  $("who").textContent = "";
}

async function showDash(user) {
  $("loginView").style.display = "none";
  $("dashView").style.display = "block";
  $("btnLogout").style.display = "";
  $("who").textContent = user.email;
  await refreshStats();
}

/* ---------- Authentification ---------- */
let failed = 0, lockedUntil = 0;

async function login() {
  const now = Date.now();
  if (now < lockedUntil) {
    say("loginMsg", "Trop de tentatives. Réessayez dans " + Math.ceil((lockedUntil - now) / 1000) + " s.", "err");
    return;
  }
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!email || !password) { say("loginMsg", "Saisissez votre e-mail et votre mot de passe.", "err"); return; }

  $("btnLogin").disabled = true;
  say("loginMsg", "Connexion…");

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  $("btnLogin").disabled = false;

  if (error) {
    failed++;
    if (failed >= 5) { lockedUntil = Date.now() + 30000; failed = 0; }
    say("loginMsg", "E-mail ou mot de passe incorrect.", "err");
    $("password").value = "";
    return;
  }
  failed = 0;
  say("loginMsg", "");
  $("password").value = "";
  showDash(data.user);
}

async function forgot() {
  const email = $("email").value.trim();
  if (!email) { say("loginMsg", "Saisissez d'abord votre e-mail ci-dessus.", "err"); return; }
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href });
  if (error) say("loginMsg", "Impossible d'envoyer l'e-mail : " + error.message, "err");
  else say("loginMsg", "Si ce compte existe, un e-mail de réinitialisation a été envoyé.", "ok");
}

async function logout() {
  await sb.auth.signOut();
  showLogin();
}

/* ---------- Statistiques ---------- */
async function refreshStats() {
  const { data, error } = await sb.from(TABLE).select("effectif_total,commune");
  if (error) { say("dashMsg", "Lecture impossible : " + error.message, "err"); return; }
  const rows = data || [];
  $("kCount").textContent = rows.length.toLocaleString("fr-FR");
  $("kStudents").textContent = rows.reduce((s, r) => s + (Number(r.effectif_total) || 0), 0).toLocaleString("fr-FR");
  $("kCommunes").textContent = new Set(rows.map(r => r.commune).filter(Boolean)).size;
}

/* ---------- Lecture CSV ---------- */
const HEADER_MAP = {
  "id_ecole": "id_ecole",
  "Nom officiel de l'établissement": "nom_ecole",
  "Type d'établissement": "type_ecole",
  "Niveau": "niveau",
  "Commune": "commune",
  "Quartier": "quartier",
  "Adresse / repère": "adresse",
  "Position GPS de l'école": "localisation",
  "Effectif total (élèves)": "effectif_total",
  "Nombre de salles de classe": "nombre_classes",
  "Statut de fonctionnement": "statut_fonctionnement",
  "Année de création": "annee_creation",
  "Source de la donnée": "source_donnee",
  "Date de collecte": "date_collecte"
};

function parseCSV(text) {
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const first = clean.split(/\r\n|\r|\n/, 1)[0] || "";
  const delim = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ";" : ",";
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i], n = clean[i + 1];
    if (q) {
      if (c === '"' && n === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(field); field = ""; }
    else if (c === "\r") { /* ignoré */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const ne = rows.filter(r => r.some(x => String(x).trim() !== ""));
  if (!ne.length) return [];
  const heads = ne[0].map(h => String(h).trim());
  return ne.slice(1).map(cells => {
    const o = {};
    heads.forEach((h, i) => { if (h) o[h] = cells[i] ?? ""; });
    return o;
  });
}

const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

/* Entier ou null (jamais de chaîne vide) */
const intOrNull = v => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };

/* Nombre décimal ou null */
const floatOrNull = v => {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/* JJ/MM/AAAA -> AAAA-MM-JJ (ou null) */
function toIsoDate(v) {
  const s = String(v || "").trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[1] + "-" + m[2] + "-" + m[3] : null;
}

function toSchool(raw, i) {
  const m = {};
  Object.entries(HEADER_MAP).forEach(([h, k]) => { if (raw[h] !== undefined) m[k] = raw[h]; });
  let lat = floatOrNull(raw["_Position GPS de l'école_latitude"]);
  let lon = floatOrNull(raw["_Position GPS de l'école_longitude"]);
  if ((lat === null || lon === null) && m.localisation) {
    const p = String(m.localisation).trim().split(/\s+/);
    const a = Number(p[0]), b = Number(p[1]);
    if (p.length >= 2 && Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180) { lat = a; lon = b; }
  }
  return {
    id_ecole: m.id_ecole || ("ECOLE-" + (i + 1)),
    nom_ecole: m.nom_ecole || "École sans nom",
    type_ecole: m.type_ecole || "",
    niveau: m.niveau || "",
    commune: m.commune || "",
    quartier: m.quartier || "",
    adresse: m.adresse || "",
    latitude: lat,
    longitude: lon,
    effectif_total: num(m.effectif_total),
    nombre_classes: num(m.nombre_classes),
    statut_fonctionnement: m.statut_fonctionnement || "",
    annee_creation: intOrNull(m.annee_creation),
    source_donnee: m.source_donnee || "",
    date_collecte: toIsoDate(m.date_collecte)
  };
}

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function handleFile(file) {
  if (!file) return;
  say("dashMsg", "Lecture du fichier…");
  try {
    const text = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsText(file, "UTF-8");
    });
    const rows = parseCSV(text);
    if (!rows.length) throw new Error("Aucune ligne exploitable dans ce fichier.");
    pendingRows = rows.map(toSchool);
    pendingName = file.name;

    const withGps = pendingRows.filter(s => s.latitude !== null && s.longitude !== null).length;
    $("preview").style.display = "block";
    $("preview").innerHTML =
      "<strong>" + esc(file.name) + "</strong> : " + pendingRows.length + " école(s), dont " + withGps + " avec coordonnées GPS." +
      "<table><thead><tr><th>ID</th><th>Nom</th><th>Type</th><th>Commune</th><th>Élèves</th></tr></thead><tbody>" +
      pendingRows.slice(0, 5).map(s => "<tr><td>" + esc(s.id_ecole) + "</td><td>" + esc(s.nom_ecole) + "</td><td>" + esc(s.type_ecole) + "</td><td>" + esc(s.commune) + "</td><td>" + esc(s.effectif_total) + "</td></tr>").join("") +
      "</tbody></table>";
    $("btnPublish").disabled = false;
    say("dashMsg", "Vérifiez l'aperçu, puis cliquez sur « Publier ».", "ok");
  } catch (e) {
    pendingRows = [];
    $("btnPublish").disabled = true;
    $("preview").style.display = "none";
    say("dashMsg", "Erreur : " + e.message, "err");
  }
}

/* ---------- Publication ---------- */
function importMode() {
  const r = document.querySelector('input[name="importMode"]:checked');
  return r ? r.value : "replace";
}

async function publish() {
  if (!pendingRows.length) return;
  const mode = importMode();

  const question = mode === "replace"
    ? "Remplacer TOUTES les données du portail par « " + pendingName + " » (" + pendingRows.length + " écoles) ?"
    : "Ajouter « " + pendingName + " » (" + pendingRows.length + " écoles) aux données existantes ?\n\nLes écoles dont l'ID existe déjà seront mises à jour, les autres seront ajoutées. Rien ne sera supprimé.";
  if (!confirm(question)) return;

  $("btnPublish").disabled = true;
  say("dashMsg", "Publication en cours…");

  if (mode === "replace") {
    const del = await sb.from(TABLE).delete().neq("id_ecole", "__jamais__");
    if (del.error) { say("dashMsg", "Suppression refusée : " + del.error.message, "err"); $("btnPublish").disabled = false; return; }
  }

  /* Évite deux lignes avec le même ID dans un même lot */
  const unique = [...new Map(pendingRows.map(r => [r.id_ecole, r])).values()];

  for (let i = 0; i < unique.length; i += 500) {
    const chunk = unique.slice(i, i + 500);
    const { error } = mode === "replace"
      ? await sb.from(TABLE).insert(chunk)
      : await sb.from(TABLE).upsert(chunk, { onConflict: "id_ecole" });
    if (error) { say("dashMsg", "Insertion échouée : " + error.message, "err"); $("btnPublish").disabled = false; return; }
  }

  say("dashMsg", "✓ " + unique.length + " école(s) " + (mode === "replace" ? "publiées (données remplacées)." : "ajoutées ou mises à jour."), "ok");
  pendingRows = [];
  $("preview").style.display = "none";
  await refreshStats();
}

/* ---------- Export ---------- */
async function exportCsv() {
  const { data, error } = await sb.from(TABLE).select("*");
  if (error || !data || !data.length) { say("dashMsg", "Aucune donnée à exporter.", "err"); return; }
  const cols = Object.keys(data[0]);
  const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const csv = [cols.map(q).join(";"), ...data.map(r => cols.map(c => q(r[c])).join(";"))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  a.download = "ecoles_bamako.csv";
  document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- Initialisation ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  $("btnLogin").addEventListener("click", login);
  $("password").addEventListener("keydown", e => { if (e.key === "Enter") login(); });
  $("email").addEventListener("keydown", e => { if (e.key === "Enter") $("password").focus(); });
  $("btnForgot").addEventListener("click", forgot);
  $("btnLogout").addEventListener("click", logout);
  $("btnPublish").addEventListener("click", publish);

  /* Choix du mode d'import (ajouté automatiquement avant le bouton Publier) */
  const modeBox = document.createElement("div");
  modeBox.style.cssText = "flex:0 0 100%;width:100%;margin:0 0 14px;display:flex;flex-direction:column;gap:6px;font-size:15px";
  modeBox.innerHTML =
    '<label style="cursor:pointer"><input type="radio" name="importMode" value="add" checked> <strong>Ajouter</strong> aux données existantes (met à jour les IDs déjà présents)</label>' +
    '<label style="cursor:pointer"><input type="radio" name="importMode" value="replace"> <strong>Remplacer</strong> toutes les données par ce fichier</label>';
  $("btnPublish").parentNode.insertBefore(modeBox, $("btnPublish"));
  $("btnExport").addEventListener("click", exportCsv);

  $("togglePwd").addEventListener("click", () => {
    const p = $("password"), show = p.type === "password";
    p.type = show ? "text" : "password";
    $("togglePwd").querySelector("i").className = "fa-solid " + (show ? "fa-eye-slash" : "fa-eye");
  });

  const drop = $("drop"), file = $("file");
  drop.addEventListener("click", () => file.click());
  file.addEventListener("change", () => { handleFile(file.files[0]); file.value = ""; });
  ["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => handleFile(e.dataTransfer.files[0]));

  const { data } = await sb.auth.getSession();
  if (data.session) showDash(data.session.user); else showLogin();

  sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") showLogin();
  });
});
