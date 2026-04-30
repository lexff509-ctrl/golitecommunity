# 🚨 CORRECTION URGENTE - Guide de Dépannage

## Situation Actuelle

Vous avez 2 OPTIONS selon votre situation :

---

## OPTION A: ❌ **Vous AVEZ déjà des données importantes (utilisateurs, paiements)**

### ⚠️ NE PAS APPLIQUER LA MIGRATION MAINTENANT !

### Solution 1: Revenir à l'ancienne version (ROLLBACK)

```bash
# 1. Récupérer l'ancienne version du code
git checkout 588ce5e

# 2. Redémarrer l'application
npm run dev
```

Vos données seront accessibles à nouveau !

### Solution 2: Appliquer la migration CORRECTEMENT

**AVANT TOUT** :

```bash
# 1. SAUVEGARDER la base de données
# Sur votre hébergeur ou localement :
pg_dump -U votre_user -d votre_database > backup_urgent.sql
```

**PUIS** :

```bash
# 2. Appliquer la migration
# Via pgAdmin, ou psql, ou votre hébergeur :
psql -U user -d database -f migrations/001_schema_fixes.sql

# OU si vous n'avez pas accès direct à psql :
# Copiez le contenu de migrations/001_schema_fixes.sql
# Et exécutez-le dans pgAdmin ou le panel de votre hébergeur
```

**ENFIN** :

```bash
# 3. Vérifier que tout fonctionne
npm run dev

# 4. Tester la connexion
# Email: admin@golite.com
# Mot de passe: votre ancien mot de passe
```

---

## OPTION B: ✅ **Vous N'AVEZ PAS de données importantes (environnement de test)**

### Solution Simple: Recréer la base de données

```bash
# 1. Supprimer toutes les tables (ATTENTION: perte de données !)
# Via pgAdmin ou votre panel hébergeur

# 2. Utiliser Drizzle Push pour créer le nouveau schéma
npm run db:push

# 3. Créer l'admin
npx tsx src/scripts/seed-admin.ts

# 4. Seed le contenu
npx tsx src/scripts/seed-content.ts

# 5. Démarrer l'app
npm run dev
```

---

## 🔍 Diagnostiquer votre problème

### Test 1: Vérifier la structure de votre base

Exécutez ce script :

```bash
npx tsx src/scripts/check-schema.ts
```

**Si vous voyez** :
```
id - uuid
email - character varying
password_hash - text
role - character varying
created_at - timestamp
```

❌ **La migration N'A PAS été appliquée**

**Si vous voyez** :
```
id - uuid
first_name - character varying    ← DOIT ÊTRE LÀ
last_name - character varying     ← DOIT ÊTRE LÀ
email - character varying
password_hash - text
role - character varying
created_at - timestamp
```

✅ **La migration A été appliquée**

---

### Test 2: Vérifier les logs d'erreur

```bash
# Démarrer en mode dev et regarder les erreurs
npm run dev
```

**Erreurs communes** :

#### Erreur: "column users.first_name does not exist"
→ La migration n'a pas été appliquée
→ Solution: Appliquer la migration (voir Option A ou B)

#### Erreur: "Cannot connect to database"
→ Problème de connexion
→ Vérifier votre .env :
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

#### Erreur: "Invalid credentials"
→ Les utilisateurs ont été modifiés
→ Solution: Réinitialiser le mot de passe (voir ci-dessous)

---

## 🔐 Réinitialiser le mot de passe admin

Si vous ne pouvez plus vous connecter :

### Méthode 1: Via SQL

```sql
-- Se connecter à votre base de données
-- Puis exécuter :
UPDATE users 
SET password_hash = '$2a$10$YourHashedPasswordHere'
WHERE email = 'admin@golite.com';
```

Pour générer le hash :

```bash
# Créer un nouveau fichier reset-password.js
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('VotreNouveauMotDePasse', 10));"
```

### Méthode 2: Recréer l'admin

```bash
# 1. Supprimer l'admin existant (via SQL ou pgAdmin)
DELETE FROM users WHERE email = 'admin@golite.com';

# 2. Recréer l'admin
npx tsx src/scripts/seed-admin.ts
```

---

## 📊 État de vos données

### Ce qui est PRÉSERVÉ par la migration :
✅ Tous les utilisateurs existants
✅ Tous les paiements existants
✅ Toutes les sessions
✅ Toutes les notifications
✅ Toute la configuration

### Ce qui est AJOUTÉ par la migration :
➕ Colonnes first_name, last_name dans users
➕ Colonnes transaction_id, amount_usd, etc. dans payments
➕ Table projects (nouvelle, vide)

### Ce qui est MODIFIÉ par la migration :
🔄 first_name/last_name générés automatiquement depuis email
🔄 transaction_id généré automatiquement
🔄 role 'user' → 'client'

**RIEN N'EST SUPPRIMÉ !**

---

## ❓ Questions Fréquentes

### Q: Mes utilisateurs peuvent-ils toujours se connecter ?
**R**: OUI, si vous avez appliqué la migration correctement.

### Q: Les paiements effectués sont-ils toujours là ?
**R**: OUI, la migration les préserve et ajoute juste de nouvelles colonnes.

### Q: Dois-je recréer les comptes ?
**R**: NON, les comptes existent toujours.

### Q: Le compte à rebours a disparu ?
**R**: Il est toujours dans la table `countdowns`. Vérifiez les logs pour l'erreur exacte.

---

## 🆘 Aide Urgente

Si rien ne fonctionne :

### 1. Regardez les logs
```bash
npm run dev
# Copiez TOUTE l'erreur qui s'affiche
```

### 2. Vérifiez le schéma
```bash
npx tsx src/scripts/check-schema.ts
# Copiez le résultat
```

### 3. Contactez avec ces infos :
- L'erreur complète
- Le résultat de check-schema.ts
- Avez-vous déjà des données importantes ? (OUI/NON)
- Avez-vous appliqué la migration ? (OUI/NON)

---

## 🔄 Rollback Complet (Retour en arrière)

Si vous voulez annuler TOUTES les modifications :

```bash
# 1. Retourner à l'ancien code
git checkout 588ce5e

# 2. (Optionnel) Annuler les changements de DB
# Exécutez le script en bas de migrations/001_schema_fixes.sql
# (la partie commentée /* ROLLBACK */)
```

---

**Choisissez l'option qui correspond à votre situation et suivez les étapes !**

**IMPORTANT** : Ne paniquez pas, vos données sont intactes ! 🙏
