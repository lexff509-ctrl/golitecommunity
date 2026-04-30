# Changelog - GoLite Community

## [2024-12-XX] - Corrections Majeures

### 🔧 Corrections du Schéma de Base de Données

#### Table `users`
- ✅ Ajout des champs `first_name` et `last_name` (VARCHAR 100)
- ✅ Correction du rôle par défaut : `user` → `client`
- ✅ Utilisation de `password_hash` au lieu de `password`

#### Table `payments`
- ✅ Ajout de `transaction_id` (VARCHAR 32, UNIQUE)
- ✅ Ajout de `project_id` (UUID, référence vers projects)
- ✅ Ajout de `first_name` et `last_name` (VARCHAR 100)
- ✅ Ajout de `amount_usd` et `amount_htg` (DECIMAL)
- ✅ `related_id` maintenant nullable
- ✅ Ajout d'index sur `project_id`

#### Table `projects` (Nouvelle)
- ✅ Création de la table complète
- ✅ Champs : `id`, `name`, `description`, `goal_amount`, `current_amount`, `status`, `image_url`, `active`, `created_at`, `updated_at`
- ✅ Index sur `status` et `active`

### 🔄 Corrections des Routes API

#### Authentication (`/api/auth/`)
- ✅ `register` - Utilise `first_name`, `last_name`, `password_hash`
- ✅ `login` - Retourne les bons champs utilisateur
- ✅ `lib/auth.ts` - Correction des queries avec `first_name`, `last_name`, `user_id`, `expires_at`

#### Notifications (`/api/notifications`)
- ✅ Correction de `userId` → `user_id`
- ✅ Correction de `createdAt` → `created_at`

#### Payments (`/api/payments`)
- ✅ Utilisation de `user_id`, `created_at`
- ✅ Création de `transaction_id` et `reference_code`
- ✅ Ajout des champs `first_name`, `last_name`, `amount_usd`, `amount_htg`
- ✅ Support de `project_id`

#### Crypto (`/api/crypto`)
- ✅ Correction de `getSession` → `getSessionUser`
- ✅ Utilisation de `session.id` au lieu de `session.userId`
- ✅ Conversion des montants en string pour DECIMAL

#### Investments (`/api/investments`)
- ✅ Correction de `getSession` → `getSessionUser`
- ✅ Utilisation de `session.id`
- ✅ Mise à jour des insertions SQL avec les bons champs

#### Admin Routes
- ✅ `programs` - Correction de `admin.userId` → `admin.id`
- ✅ `settings` - Correction de `session.userId` → `session.id`
- ✅ `payments` - Gestion de `related_id` nullable, correction des logs admin
- ✅ `projects` - Adaptation au nouveau schéma (goal_amount, current_amount, etc.)
- ✅ `projects/[id]` - Mise à jour des queries et mutations
- ✅ `users/[id]` - Support de `db.query` avec schéma

### 📝 Corrections des Scripts

#### `seed-admin.ts`
- ✅ Utilise `first_name`, `last_name`, `password_hash`

#### `seed-content.ts`
- ✅ Import de `projects` depuis schema
- ✅ Correction des champs projects (goal_amount, current_amount)
- ✅ Suppression des références à countdown_id

#### `check-schema.ts`
- ✅ Ajout du type pour `row` parameter

### 🏗️ Infrastructure

#### Database Connection (`db/index.ts`)
- ✅ Ajout du schéma au client Drizzle
- ✅ Support de `db.query.*` pour les relations

### 📊 Résultats des Tests

#### TypeScript
```bash
npm run typecheck
✅ PASSED - Aucune erreur TypeScript
```

#### Build Production
```bash
npm run build
✅ PASSED - Build réussi
- 16 pages statiques
- 31 routes dynamiques
- Optimisation réussie
```

#### ESLint
```bash
npm run lint
⚠️  9 warnings (non-bloquants)
- react-hooks/set-state-in-effect dans useEffect
- Recommandations pour Image next/image
```

### 📋 Migrations Nécessaires

Pour les bases de données existantes, exécuter :

```sql
-- Ajouter first_name et last_name à users
ALTER TABLE users 
ADD COLUMN first_name VARCHAR(100),
ADD COLUMN last_name VARCHAR(100);

-- Mettre à jour les données existantes (exemple)
UPDATE users SET 
  first_name = split_part(email, '@', 1),
  last_name = 'User'
WHERE first_name IS NULL;

-- Rendre les colonnes NOT NULL après migration
ALTER TABLE users 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Ajouter colonnes à payments
ALTER TABLE payments
ADD COLUMN transaction_id VARCHAR(32),
ADD COLUMN project_id UUID,
ADD COLUMN first_name VARCHAR(100),
ADD COLUMN last_name VARCHAR(100),
ADD COLUMN amount_usd DECIMAL(10, 2),
ADD COLUMN amount_htg DECIMAL(12, 2);

-- Créer index
CREATE UNIQUE INDEX IF NOT EXISTS unique_transaction_id 
ON payments(transaction_id);

CREATE INDEX IF NOT EXISTS idx_payment_project 
ON payments(project_id);

-- Créer table projects
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

### 🚀 Prochaines Étapes

1. ✅ Corrections appliquées
2. ✅ Tests réussis
3. ✅ Build de production OK
4. 📦 Déploiement
   - Push vers GitHub
   - Déploiement sur serveur
   - Migration de la base de données
   - Tests en production

### 📚 Documentation Ajoutée

- ✅ README.md complet
- ✅ CHANGELOG.md détaillé
- ✅ Scripts de déploiement
- ✅ Guide de migration

### 🔐 Sécurité

- ✅ Validation des entrées renforcée
- ✅ Gestion des nullables corrigée
- ✅ Types TypeScript stricts
- ✅ Logs admin implémentés

---

**Auteur**: Assistant AI  
**Date**: 2024  
**Version**: 1.0.0 - Correction Complète
