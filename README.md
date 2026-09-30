# 🗺️ Projet-G — Portail SIG des Écoles de Bamako

## 📍 Présentation du projet

**Projet-G** est un portail web consacré à la **cartographie et à la gestion des établissements scolaires de la ville de Bamako, au Mali**.

L'objectif du projet est de mettre en place une plateforme simple et accessible permettant de **localiser les écoles sur une carte interactive**, de consulter leurs principales informations et, pour les utilisateurs autorisés, de gérer les données enregistrées dans la base de données.

Les informations présentées sur le portail proviennent de la **collecte de données réalisée sur le terrain en 2026**.

Ce projet associe les technologies du **développement web**, des **Systèmes d'Information Géographique (SIG)** et des **bases de données** afin de faciliter la consultation et la gestion des informations scolaires.

---

## 🎯 Objectifs

Le projet a été conçu autour de plusieurs objectifs :

* 📍 Localiser les établissements scolaires de Bamako grâce à leurs coordonnées GPS.
* 🗺️ Présenter les écoles sur une carte interactive.
* 🏫 Permettre la consultation des informations principales de chaque établissement.
* 💾 Centraliser les données dans une base de données structurée.
* 🔐 Sécuriser l'accès aux opérations d'administration.
* 📊 Faciliter l'exploitation des données pour l'analyse et la planification.
* 🌐 Mettre à disposition un portail accessible depuis un navigateur web.

À terme, l'objectif est de disposer d'une base de données pouvant être enrichie progressivement avec de nouveaux établissements et de nouvelles informations collectées sur le terrain.

---

## ✨ Fonctionnalités

### 🌍 Portail public

Le portail public permet notamment de :

* consulter la carte des établissements scolaires ;
* rechercher une école ;
* filtrer les établissements selon différents critères ;
* afficher les informations d'une école directement depuis la carte ;
* visualiser la répartition des écoles ;
* consulter les statistiques disponibles.

### 🔐 Interface d'administration

Une interface dédiée permet aux utilisateurs autorisés de gérer les données du portail.

Elle peut notamment être utilisée pour :

* ajouter une école ;
* modifier les informations existantes ;
* supprimer une donnée lorsque cela est nécessaire ;
* vérifier les informations enregistrées.

L'accès aux fonctions d'administration est réservé aux utilisateurs autorisés.

---

## 🧩 Technologies utilisées

| Domaine                           | Technologies          |
| --------------------------------- | --------------------- |
| Front-end                         | HTML, CSS, JavaScript |
| Cartographie                      | Leaflet               |
| Données cartographiques           | OpenStreetMap         |
| Base de données                   | PostgreSQL            |
| Hébergement / services de données | Supabase              |
| Icônes                            | Font Awesome          |
| Collecte des données              | KoboToolbox           |
| Gestion du projet                 | Git / GitHub          |

### 🔗 Comment les technologies travaillent ensemble

Le fonctionnement général du projet peut être résumé ainsi :

**Collecte terrain → KoboToolbox → PostgreSQL / Supabase → Application web → Carte interactive**

Les données collectées sur le terrain sont structurées puis enregistrées dans la base de données. Le portail web récupère ensuite ces informations afin de les afficher sous forme de carte, de statistiques et de fiches d'établissements.

---

## 🗂️ Structure du projet

```text
Projet-G/
│
├── index.html
├── admin.html
├── accueil-fragment.html
│
├── accueil-officiel.css
├── accueil-pro.css
├── portail-public.css
├── style.css
│
├── accueil-officiel.js
├── accueil.js
├── app.js
├── admin.js
│
├── sceau-mali.png
│
└── supabase-setup.sql
```

### 📄 Principaux fichiers

* **`index.html`** : page principale du portail public.
* **`admin.html`** : interface destinée à l'administration.
* **`app.js`** : gestion principale de la carte, des données et des interactions.
* **`admin.js`** : fonctionnalités liées à l'administration.
* **`style.css`** : styles généraux du projet.
* **`portail-public.css`** : styles spécifiques au portail public.
* **`accueil-officiel.css`** : mise en forme de la page d'accueil officielle.
* **`supabase-setup.sql`** : script permettant de préparer la base de données.

---

# 🚀 Installation

## 1. Cloner le projet

Commencez par récupérer le dépôt GitHub :

```bash
git clone https://github.com/TON-COMPTE/Projet-G.git
cd Projet-G
```

> Remplacez `TON-COMPTE` par le nom du compte GitHub qui héberge le projet.

---

## 2. Préparer la base de données

Le projet utilise **PostgreSQL via Supabase** pour stocker les informations relatives aux établissements scolaires.

### Étapes

1. Créer un projet sur [Supabase](https://supabase.com/?utm_source=chatgpt.com).
2. Ouvrir l'éditeur SQL.
3. Copier le contenu du fichier :

```text
supabase-setup.sql
```

4. Exécuter le script afin de créer et configurer les éléments nécessaires à la base de données.

---

## 3. Configurer la connexion Supabase

L'application doit connaître l'adresse du projet Supabase ainsi que la clé publique permettant au navigateur d'accéder aux données autorisées.

Dans les fichiers concernés, renseignez :

```js
const SUPABASE_URL = "https://VOTRE-PROJET.supabase.co";
const SUPABASE_ANON_KEY = "VOTRE_CLE_ANON";
```

### ⚠️ Important

La clé **`service_role` ne doit jamais être publiée dans le code JavaScript du navigateur**.

La clé destinée au fonctionnement côté client doit être utilisée avec des règles **Row Level Security (RLS)** correctement configurées.

---

# 💻 Lancer le projet

Le projet peut être ouvert directement dans un navigateur, mais l'utilisation d'un serveur local est recommandée.

### Avec Python

Depuis le dossier du projet :

```bash
python -m http.server 8000
```

Puis ouvrir :

```text
http://localhost:8000
```

### Avec VS Code

Il est également possible d'utiliser l'extension **Live Server** de Visual Studio Code.

---

# 🗺️ Fonctionnement général

Le portail repose sur une chaîne de traitement permettant de transformer les données collectées sur le terrain en informations accessibles sur une carte.

```text
📱 Collecte terrain
        │
        ▼
   KoboToolbox
        │
        ▼
   Données collectées
        │
        ▼
 PostgreSQL / Supabase
        │
        ▼
    Application web
        │
        ▼
🗺️ Carte interactive
```

Chaque établissement peut être associé à différentes informations, notamment :

* son identifiant ;
* son nom ;
* son type ;
* son niveau d'enseignement ;
* sa commune ;
* son quartier ;
* ses coordonnées GPS ;
* son effectif ;
* son nombre de classes ;
* son statut de fonctionnement ;
* son année de création ;
* sa source de données.

---

# 🔐 Sécurité

La sécurité constitue un élément important du projet.

Les principales précautions mises en place sont :

* utilisation des règles **Row Level Security (RLS)** de Supabase ;
* séparation entre l'accès public et les fonctions d'administration ;
* protection des opérations sensibles ;
* absence de fichiers `.env` contenant des informations confidentielles dans le dépôt GitHub ;
* interdiction de publier la clé `service_role`.

Les règles de sécurité doivent être adaptées aux besoins réels du projet avant une mise en production.

---

# 📊 Données

Les données actuellement utilisées dans le portail proviennent de la **collecte terrain 2026**.

L'utilisation de coordonnées GPS permet de représenter spatialement les établissements scolaires et d'offrir une lecture géographique des données.

La base peut ensuite être enrichie progressivement avec de nouvelles collectes afin d'obtenir une représentation plus complète des établissements scolaires de Bamako.

---

# 🔄 Gestion du projet avec Git

Pour contribuer au projet, il est possible de créer une branche dédiée :

```bash
git checkout -b ma-fonctionnalite
```

Après avoir effectué les modifications :

```bash
git add .
git commit -m "Description de la modification"
git push origin ma-fonctionnalite
```

Une Pull Request peut ensuite être créée afin de proposer les modifications.

---

# 👨‍💻 À propos du projet

**Projet-G** est un projet réalisé autour de la **géolocalisation des établissements scolaires de Bamako**.

Il met en pratique plusieurs compétences :

* développement web ;
* bases de données relationnelles ;
* géolocalisation GPS ;
* cartographie numérique ;
* systèmes d'information géographique (SIG) ;
* gestion de données ;
* Git et GitHub.

L'objectif est surtout de montrer comment des données collectées sur le terrain peuvent être **structurées, stockées, exploitées et finalement représentées sous forme d'une application cartographique**.

---

## 🇲🇱 Projet réalisé à Bamako — Mali

**Projet-G — Portail SIG des Écoles de Bamako**

> *Des données de terrain vers une information géographique utile à la compréhension et à la planification du système éducatif.*
