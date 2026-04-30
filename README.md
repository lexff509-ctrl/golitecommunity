# GoLite Community Platform

Plateforme communautaire d'investissement et de trading éducatif.

## 🚀 Corrections Appliquées

### ✅ Problèmes Résolus

1. **Schéma de base de données corrigé**
   - Ajout des champs `first_name` et `last_name` dans la table `users`
   - Ajout de la table `projects` manquante
   - Correction des champs de la table `payments` (ajout de `transaction_id`, `first_name`, `last_name`, `amount_usd`, `amount_htg`, `project_id`)
   - Standardisation de la nomenclature (snake_case pour la DB)

2. **Corrections TypeScript**
   - Correction de tous les appels API utilisant les anciens noms de champs
   - Mise à jour de `lib/auth.ts` pour utiliser les bons champs
   - Correction des routes API : `register`, `login`, `notifications`, `payments`, `crypto`, `investments`
   - Correction des routes admin : `programs`, `settings`, `payments`, `projects`
   - Ajout du schéma à l'instance Drizzle pour supporter `db.query`

3. **Scripts de seed corrigés**
   - `seed-admin.ts` - Utilise maintenant `first_name`, `last_name`, `password_hash`
   - `seed-content.ts` - Corrections pour la table `projects`
   - `check-schema.ts` - Ajout du type pour éviter les erreurs TypeScript

## 📋 Structure du Projet

```
src/
├── app/
│   ├── api/            # Routes API
│   ├── admin/          # Pages d'administration
│   ├── dashboard/      # Pages utilisateur
│   └── ...
├── db/
│   ├── schema.ts       # Schéma de base de données Drizzle
│   └── index.ts        # Configuration DB
├── lib/
│   ├── auth.ts         # Authentification
│   └── ...
└── scripts/
    ├── seed-admin.ts   # Créer un utilisateur admin
    └── seed-content.ts # Seed initial content
```

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.production.example .env
# Éditer .env avec vos credentials

# Synchroniser le schéma avec la base de données
npm run db:push

# Créer un utilisateur admin
npx tsx src/scripts/seed-admin.ts

# Seed le contenu initial (FAQ, config, etc.)
npx tsx src/scripts/seed-content.ts
```

## 🔑 Compte Admin par Défaut

Après avoir exécuté `seed-admin.ts` :
- **Email**: admin@golite.com
- **Mot de passe**: 123456

⚠️ **Changez ce mot de passe en production !**

## 🚀 Démarrage

```bash
# Développement
npm run dev

# Build de production
npm run build

# Démarrer en production
npm start
```

## 📊 Base de Données

### Tables Principales

- **users** - Utilisateurs (clients et admins)
- **sessions** - Sessions d'authentification
- **programs** - Programmes d'investissement
- **investments** - Investissements des utilisateurs
- **payments** - Paiements
- **projects** - Projets communautaires
- **crypto_transactions** - Transactions crypto
- **notifications** - Système de notifications
- **faqs** - Questions fréquentes
- **onboarding_steps** - Étapes d'intégration
- **countdowns** - Comptes à rebours
- **settings** - Configuration du site

### Migration du Schéma

Si vous avez une base de données existante, vous devrez migrer les données :

```sql
-- Ajouter les colonnes manquantes à users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Mettre à jour le rôle par défaut
ALTER TABLE users 
ALTER COLUMN role SET DEFAULT 'client';

-- Ajouter les colonnes manquantes à payments
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(32) UNIQUE,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS amount_usd DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS amount_htg DECIMAL(12, 2);

-- Créer la table projects si elle n'existe pas
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  goal_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 🧪 Tests

```bash
# Vérification TypeScript
npm run typecheck

# Lint
npm run lint

# Vérifier le schéma de la DB
npx tsx src/scripts/check-schema.ts
```

## 📝 Scripts Disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Build de production
- `npm start` - Démarrer en mode production
- `npm run lint` - Linter le code
- `npm run typecheck` - Vérifier les types TypeScript
- `npm run db:generate` - Générer les migrations Drizzle
- `npm run db:push` - Synchroniser le schéma avec la DB
- `npm run db:migrate` - Appliquer les migrations

## 🔐 Sécurité

- Les mots de passe sont hashés avec bcrypt
- Sessions sécurisées avec tokens UUID
- Validation des entrées utilisateur
- Protection CSRF avec cookies httpOnly
- Rate limiting sur les endpoints sensibles

## 📦 Déploiement

### Variables d'Environnement Requises

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NODE_ENV=production
```

### Build et Déploiement

```bash
npm run build
npm start
```

Voir `DEPLOY-HOSTINGER.md` et `DEPLOY-FREE.md` pour des instructions détaillées.

## 🐛 Problèmes Connus et Solutions

### ESLint Warnings (Non-Bloquants)

Les warnings ESLint concernant `set-state-in-effect` sont des recommandations de bonnes pratiques React. Ils n'empêchent pas le build mais peuvent être corrigés en refactorisant les composants.

Pour ignorer temporairement ces warnings :
```javascript
// eslint-disable-next-line react-hooks/set-state-in-effect
```

### Migration de Données

Si vous migrez d'un ancien schéma, assurez-vous de :
1. Sauvegarder votre base de données
2. Mettre à jour le schéma progressivement
3. Migrer les données existantes vers les nouveaux champs
4. Tester avant de déployer en production

## 📞 Support

Pour toute question ou problème :
- Telegram: @golitecommunity
- GitHub Issues: [Créer une issue]

## 📄 Licence

Propriétaire - GoLite Community © 2024
