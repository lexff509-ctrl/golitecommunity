# 🚀 Guide de Déploiement GRATUIT — GoLite Community Support

## ⚠️ Pourquoi ça ne marche pas sur Hostinger Partagé ?

L'hébergement partagé Hostinger (Single, Premium, Business) supporte uniquement **PHP + MySQL**.
Next.js nécessite **Node.js** — ce qui n'est disponible que sur un **VPS**.

---

## 🏆 Les 3 meilleures solutions GRATUITES

---

## ✅ OPTION 1 : Vercel + Neon (RECOMMANDÉ — 100% gratuit)

### Étape 1 : Créer un compte GitHub

1. Allez sur [github.com](https://github.com) 
2. Créez un compte gratuit
3. Créez un **nouveau repository** nommé `golite-community`

### Étape 2 : Installer Git et pousser le code

Sur votre **PC local** (pas le serveur), installez [Git](https://git-scm.com/downloads) puis :

```bash
# Naviguez dans le dossier du projet
cd /chemin/vers/golite

# Initialisez Git
git init
git add .
git commit -m "Initial commit"

# Connectez-vous à GitHub
git remote add origin https://github.com/VOTRE_USER/golite-community.git
git branch -M main
git push -u origin main
```

### Étape 3 : Créer la base PostgreSQL GRATUITE sur Neon

1. Allez sur [neon.tech](https://neon.tech)
2. Créez un compte avec **GitHub** (clic)
3. Cliquez **Create Project**
4. Choisissez la région la plus proche
5. Copiez l'**URI de connexion** — elle ressemble à :
   ```
   postgresql://neondb_owner:xxxxx@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Étape 4 : Déployer sur Vercel (gratuit)

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez **"Sign Up"** → connectez-vous avec **GitHub**
3. Cliquez **"Add New Project"**
4. Sélectionnez votre repository `golite-community`
5. Avant de déployer, ajoutez la variable d'environnement :
   - **Name** : `DATABASE_URL`
   - **Value** : collez l'URI de Neon
6. Cliquez **"Deploy"**
7. ✅ Votre site est en ligne sur `https://golite-community.vercel.app`

### Étape 5 : Appliquer la base de données

Dans Vercel, allez dans votre projet → **Settings** → **Environment Variables** et vérifiez que `DATABASE_URL` est bien là.

Ensuite, appliquez le schema sur Neon :

**Sur votre PC** (avec le `.env` qui contient l'URL Neon) :
```bash
# Installez les dépendances
npm install

# Appliquez le schema
npx drizzle-kit push

# Créez l'admin
npx tsx src/scripts/seed-admin.ts
```

### Étape 6 : Upload des fichiers (preuves de paiement)

Vercel est **serverless** — les fichiers uploadés ne persistent pas.
Pour la production, modifiez l'upload pour utiliser un stockage cloud.

**Pour le test/démo**, ça fonctionne directement.

---

## 🥈 OPTION 2 : Railway (tout-en-un, ~gratuit)

### Étape 1 : Créer un compte

1. Allez sur [railway.app](https://railway.app)
2. Créez un compte avec **GitHub**
3. Vous recevez **$5 de crédit gratuit** par mois (~500h de serveur)

### Étape 2 : Créer le projet

1. Cliquez **"New Project"**
2. Sélectionnez **"Deploy from GitHub Repo"**
3. Choisissez `golite-community`
4. Railway détecte automatiquement Next.js

### Étape 3 : Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway crée automatiquement la variable `DATABASE_URL`
3. Connectez-la à votre service Next.js

### Étape 4 : Configurer

Dans les **Variables** de votre service, ajoutez :
```
DATABASE_URL = (auto-généré par Railway)
```

### Étape 5 : Déployer

Railway déploie automatiquement. Votre URL sera quelque chose comme :
`https://golite-community-production.up.railway.app`

### Étape 6 : Appliquer le schema

Dans l'onglet **Shell** de Railway :
```bash
npx drizzle-kit push
npx tsx src/scripts/seed-admin.ts
```

---

## 🥉 OPTION 3 : Render (gratuit avec limites)

### Étape 1 : Créer un compte

1. Allez sur [render.com](https://render.com)
2. Créez un compte avec **GitHub**

### Étape 2 : Créer la base PostgreSQL

1. Cliquez **"New"** → **"PostgreSQL"**
2. Nom : `golite-db`
3. Plan : **Free**
4. Notez les infos de connexion

### Étape 3 : Créer le service Web

1. Cliquez **"New"** → **"Web Service"**
2. Connectez votre repo GitHub
3. Configuration :
   - **Name** : `golite`
   - **Build Command** : `npm install && npm run build && npx drizzle-kit push && npx tsx src/scripts/seed-admin.ts`
   - **Start Command** : `npm run start`
   - **Plan** : Free
4. Ajoutez la variable `DATABASE_URL` avec l'URI de la DB
5. Cliquez **"Create Web Service"**

⚠️ Le plan gratuit de Render **se met en veille après 15 min d'inactivité**.

---

## 📊 Comparaison

| Critère | Vercel + Neon | Railway | Render |
|---------|:---:|:---:|:---:|
| **Prix** | 100% gratuit | ~$0 (crédit $5) | Gratuit |
| **Base PostgreSQL** | Neon (gratuit) | Inclus | Gratuit (limité) |
| **Uptime** | ✅ Toujours allumé | ✅ Toujours allumé | ⚠️ Veille après 15 min |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Facilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Limite** | 100GB bandwidth/mois | ~500h/mois | 750h/mois |
| **SSL (HTTPS)** | ✅ Auto | ✅ Auto | ✅ Auto |
| **Custom Domain** | ✅ | ✅ | ✅ |

---

## 🎯 Ma recommandation

**Pour commencer → Vercel + Neon** (option 1)
- C'est le plus simple
- 100% gratuit
- Ne s'éteint jamais
- Le meilleur pour Next.js

**Pour tout-en-un → Railway** (option 2)
- Base de données inclus
- $5 gratuits par mois
- Déploiement super rapide

---

## 🔑 Identifiants Admin (toutes les options)

| | Valeur |
|---|---|
| 📧 Email | `admin@golite.com` |
| 🔑 Mot de passe | `123456` |

---

## 📝 Résumé des commandes (Option 1 : Vercel + Neon)

```bash
# Sur votre PC :
cd golite
git init && git add . && git commit -m "v1"
git remote add origin https://github.com/VOTRE_USER/golite-community.git
git push -u origin main

# Installer les dépendances
npm install

# Configurer .env avec l'URL de Neon
echo "DATABASE_URL=postgresql://..." > .env

# Appliquer le schema
npx drizzle-kit push

# Créer l'admin
npx tsx src/scripts/seed-admin.ts

# Puis aller sur vercel.com → Importer le repo → Deploy
```
