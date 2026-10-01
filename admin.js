<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Administration · SIG Écoles Bamako</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--gold:#d4af37;--gold-d:#a8842a;--ink:#241f12;--soft:#5c5335;--muted:#9a8c5c;--line:#e6dcb8;--bg:#f7f3e8;--red:#ce1126;--green:#009639}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh}
.flag{display:flex;height:6px}.flag span{flex:1}
.flag span:nth-child(1){background:#009639}.flag span:nth-child(2){background:#FCD116}.flag span:nth-child(3){background:#CE1126}
header{display:flex;align-items:center;gap:14px;padding:14px 28px;background:#fff;border-bottom:1px solid var(--line)}
header img{height:48px}
header small{display:block;font-weight:700;font-size:11px;letter-spacing:.16em;text-transform:uppercase}
header em{font-size:10.5px;color:var(--gold-d)}
header .sp{flex:1}
header a,header button.link{font:600 12px Inter;color:var(--soft);text-decoration:none;background:none;border:0;cursor:pointer}
header a:hover,header button.link:hover{color:var(--ink)}
main{max-width:920px;margin:0 auto;padding:36px 20px}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 12px 36px rgba(184,145,46,.12);padding:28px}
#loginView{max-width:420px;margin:40px auto 0;text-align:center}
.icon{width:56px;height:56px;border-radius:50%;background:var(--gold);color:#fff;display:grid;place-items:center;font-size:22px;margin:0 auto 14px}
h1{font-size:22px;margin:0 0 6px}h2{font-size:16px;margin:0 0 14px}
.sub{font-size:13px;color:var(--soft);margin:0 0 22px;line-height:1.5}
label{display:block;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:14px 0 6px}
.inp{position:relative}.inp i.l{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:14px}
.inp input{width:100%;padding:12px 40px 12px 38px;border:1px solid var(--line);border-radius:10px;font:14px Inter;background:#faf6ea}
.inp input:focus{outline:2px solid var(--gold);border-color:var(--gold);background:#fff}
.inp button{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:none;color:var(--muted);cursor:pointer;padding:8px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:700 13px Inter;padding:12px 20px;border-radius:10px;border:1px solid var(--gold);background:var(--gold);color:#fff;cursor:pointer;transition:.15s}
.btn:hover{filter:brightness(1.06);transform:translateY(-1px)}
.btn.ghost{background:#fff;color:var(--ink);border-color:var(--line)}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn.full{width:100%;margin-top:20px}
.msg{min-height:18px;margin-top:12px;font-size:12.5px;font-weight:600}
.msg.err{color:var(--red)}.msg.ok{color:var(--green)}
.forgot{margin-top:14px;font-size:12px}
.forgot button{background:none;border:0;color:var(--gold-d);font:600 12px Inter;cursor:pointer;text-decoration:underline}
#dashView{display:none}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}
.kpi{background:#fff;border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:12px;padding:16px}
.kpi b{display:block;font-size:26px;color:var(--gold-d)}.kpi span{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.drop{border:2px dashed var(--gold);border-radius:14px;padding:30px;text-align:center;background:#faf6ea;cursor:pointer}
.drop:hover,.drop.over{background:#f3ead0}
.drop i{font-size:30px;color:var(--gold-d);margin-bottom:8px}
.preview{margin-top:16px;font-size:13px;display:none}
.preview table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
.preview th,.preview td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}
.preview th{color:var(--gold-d);font-size:10.5px;text-transform:uppercase}
.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.who{font-size:12px;color:var(--soft)}
@media(max-width:640px){.grid{grid-template-columns:1fr}header{padding:12px 14px}header em{display:none}}
</style>
</head>
<body>
<div class="flag"><span></span><span></span><span></span></div>
<header>
  <img src="sceau-mali.png" alt="Sceau du Mali" onerror="this.style.display='none'">
  <div><small>République du Mali</small><em>Un Peuple – Un But – Une Foi</em></div>
  <div class="sp"></div>
  <span class="who" id="who"></span>
  <a href="index.html"><i class="fa-solid fa-arrow-left"></i> Portail public</a>
  <button class="link" id="btnLogout" style="display:none"><i class="fa-solid fa-right-from-bracket"></i> Déconnexion</button>
</header>

<main>
  <!-- CONNEXION -->
  <section class="card" id="loginView">
    <div class="icon"><i class="fa-solid fa-shield-halved"></i></div>
    <h1>Espace administration</h1>
    <p class="sub">Connectez-vous avec votre adresse e-mail et votre mot de passe pour gérer les données du portail.</p>
    <label for="email">Adresse e-mail</label>
    <div class="inp"><i class="fa-solid fa-envelope l"></i><input id="email" type="email" autocomplete="username" placeholder="admin@exemple.ml"></div>
    <label for="password">Mot de passe</label>
    <div class="inp"><i class="fa-solid fa-lock l"></i><input id="password" type="password" autocomplete="current-password" placeholder="Mot de passe">
      <button type="button" id="togglePwd" aria-label="Afficher le mot de passe"><i class="fa-solid fa-eye"></i></button></div>
    <div class="msg" id="loginMsg" role="status"></div>
    <button class="btn full" id="btnLogin"><i class="fa-solid fa-arrow-right-to-bracket"></i> Se connecter</button>
    <div class="forgot"><button type="button" id="btnForgot">Mot de passe oublié ?</button></div>
  </section>

  <!-- TABLEAU DE BORD -->
  <section id="dashView">
    <div class="grid">
      <div class="kpi"><b id="kCount">—</b><span>Écoles en base</span></div>
      <div class="kpi"><b id="kStudents">—</b><span>Élèves (total)</span></div>
      <div class="kpi"><b id="kCommunes">—</b><span>Communes</span></div>
    </div>

    <div class="card">
      <h2><i class="fa-solid fa-file-csv"></i> Importer / remplacer les données</h2>
      <p class="sub">Le fichier CSV importé remplace <strong>toutes</strong> les données actuelles du portail.</p>
      <div class="drop" id="drop"><i class="fa-solid fa-cloud-arrow-up"></i><div><strong>Cliquez ou déposez un fichier CSV</strong></div></div>
      <input type="file" id="file" accept=".csv,text/csv" hidden>
      <div class="preview" id="preview"></div>
      <div class="msg" id="dashMsg" role="status"></div>
      <div class="row">
        <button class="btn" id="btnPublish" disabled><i class="fa-solid fa-upload"></i> Publier sur le portail</button>
        <button class="btn ghost" id="btnExport"><i class="fa-solid fa-download"></i> Télécharger les données (CSV)</button>
      </div>
    </div>
  </section>
</main>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="admin.js"></script>
</body>
</html>
