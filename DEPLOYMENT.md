# 🚀 Guide de Déploiement - GoLite Community

## ✅ Pré-requis

Avant de déployer, assurez-vous que :

- ✅ Toutes les corrections ont été appliquées
- ✅ Le build de production fonctionne (`npm run build`)
- ✅ Le typecheck passe sans erreur (`npm run typecheck`)
- ✅ Vous avez accès à une base de données PostgreSQL
- ✅ Vous avez un compte GitHub (pour le versioning)

## 📋 Étapes de Déploiement

### 1️⃣ Préparer le Code

```bash
# Vérifier que tout est à jour
npm install
npm run typecheck
npm run build
```

### 2️⃣ Sauvegarder la Base de Données Existante

```bash
# Sur votre serveur PostgreSQL
pg_dump -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3️⃣ Appliquer les Migrations

```bash
# Option A: Utiliser Drizzle Push (recommandé pour développement)
npm run db:push

# Option B: Utiliser le script SQL manuel (recommandé pour production)
psql -U username -d database_name -f migrations/001_schema_fixes.sql
```

### 4️⃣ Initialiser les Données

```bash
# Créer un utilisateur admin
npx tsx src/scripts/seed-admin.ts

# Seed le contenu initial (FAQ, config, onboarding)
npx tsx src/scripts/seed-content.ts
```

### 5️⃣ Push vers GitHub

```bash
# Méthode automatique (Windows)
git-push.bat

# Méthode manuelle
git init
git add .
git commit -m "Fix: Correction complète du projet"
git branch -M main
git remote add origin https://github.com/votre-username/votre-repo.git
git push -u origin main
```

### 6️⃣ Variables d'Environnement

Créer un fichier `.env` sur le serveur de production :

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Environment
NODE_ENV=production

# Optional: Session Config
SESSION_DURATION_HOURS=72
```

### 7️⃣ Déployer l'Application

#### Option A: Serveur Node.js Direct

```bash
# Build
npm run build

# Démarrer avec PM2 (recommandé)
npm install -g pm2
pm2 start npm --name "golite-community" -- start
pm2 save
pm2 startup
```

#### Option B: Vercel

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel

# Configuration sur Vercel
# - Ajouter DATABASE_URL dans les variables d'environnement
# - Build Command: npm run build
# - Output Directory: .next
```

#### Option C: Hostinger (cPanel)

Voir `DEPLOY-HOSTINGER.md` pour les instructions détaillées.

## 🔍 Vérification Post-Déploiement

### 1. Tester la Base de Données

```bash
# Vérifier le schéma
npx tsx src/scripts/check-schema.ts

# Devrait afficher:
# id - uuid
# first_name - character varying
# last_name - character varying
# email - character varying
# password_hash - text
# role - character varying
# created_at - timestamp
```

### 2. Tester l'Application

```bash
# Santé de l'API
curl https://votre-domaine.com/api/health

# Login admin
curl -X POST https://votre-domaine.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@golite.com","password":"123456"}'
```

### 3. Vérifier les Logs

```bash
# Avec PM2
pm2 logs golite-community

# Avec Vercel
vercel logs
```

## ⚠️ Problèmes Courants et Solutions

### Erreur: "first_name does not exist"

**Cause**: La migration n'a pas été appliquée

**Solution**:
```bash
# Appliquer la migration manuellement
psql -U user -d database -f migrations/001_schema_fixes.sql
```

### Erreur: "Cannot connect to database"

**Cause**: DATABASE_URL incorrecte

**Solution**:
```bash
# Vérifier la connection string
echo $DATABASE_URL

# Format correct:
# postgresql://username:password@host:port/database?sslmode=require
```

### Erreur: "Module not found"

**Cause**: node_modules manquants

**Solution**:
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Build échoue avec erreurs TypeScript

**Cause**: Types non à jour

**Solution**:
```bash
# Nettoyer et rebuild
rm -rf .next
npm run typecheck
npm run build
```

## 📊 Monitoring

### Avec PM2

```bash
# Statut
pm2 status

# Redémarrer
pm2 restart golite-community

# Recharger sans downtime
pm2 reload golite-community

# Logs en temps réel
pm2 logs golite-community --lines 100
```

### Avec Vercel

- Dashboard: https://vercel.com/dashboard
- Logs en temps réel
- Analytics intégrés
- Edge Functions monitoring

## 🔐 Sécurité Post-Déploiement

### 1. Changer le Mot de Passe Admin

```sql
-- Se connecter à la base de données
UPDATE users 
SET password_hash = crypt('nouveau_mot_de_passe_securise', gen_salt('bf'))
WHERE email = 'admin@golite.com';
```

### 2. Configurer HTTPS

- Utiliser Let's Encrypt (gratuit)
- Ou certificat SSL de votre hébergeur
- Forcer HTTPS dans Next.js config

### 3. Activer les Protections

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

## 🔄 Mises à Jour Futures

```bash
# Pull les dernières modifications
git pull origin main

# Installer les nouvelles dépendances
npm install

# Rebuild
npm run build

# Redémarrer
pm2 reload golite-community
```

## 📞 Support

Si vous rencontrez des problèmes lors du déploiement :

1. Vérifier les logs d'erreur
2. Consulter ce guide
3. Vérifier la documentation Next.js
4. Contacter le support Telegram: @golitecommunity

## 📝 Checklist de Déploiement

- [ ] Code testé localement
- [ ] Build de production réussi
- [ ] Base de données sauvegardée
- [ ] Migrations appliquées
- [ ] Variables d'environnement configurées
- [ ] Code pushé sur GitHub
- [ ] Application déployée
- [ ] Tests post-déploiement effectués
- [ ] Mot de passe admin changé
- [ ] HTTPS activé
- [ ] Monitoring configuré
- [ ] Équipe notifiée

---

**Bonne chance avec votre déploiement ! 🚀**
