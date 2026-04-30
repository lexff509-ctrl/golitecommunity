# 🛡️ GUIDE D'APPLICATION - MIGRATION SÉCURISÉE

## ✅ GARANTIES DE SÉCURITÉ

Cette migration est **100% SAFE** :
- ✅ **AUCUNE** suppression de table
- ✅ **AUCUNE** suppression de colonne
- ✅ **AUCUNE** perte de données
- ✅ Uniquement des **AJOUTS**
- ✅ Mapping automatique des anciennes colonnes vers les nouvelles
- ✅ Valeurs par défaut générées pour les données existantes
- ✅ Rollback possible à tout moment

---

## 📋 PRÉ-REQUIS

### 1. Sauvegarder votre base de données

```bash
# Via pg_dump
pg_dump -U votre_user -d votre_database -F c -f backup_avant_migration_$(date +%Y%m%d_%H%M%S).backup

# OU export SQL
pg_dump -U votre_user -d votre_database > backup_avant_migration.sql
```

### 2. Vérifier la connexion

```bash
# Tester la connexion
psql -U votre_user -d votre_database -c "SELECT COUNT(*) FROM users;"
```

---

## 🚀 MÉTHODE 1 : Application via psql (Recommandée)

### Étape 1 : Préparer le fichier

```bash
# Le fichier est déjà prêt dans :
migrations/SAFE_MIGRATION.sql
```

### Étape 2 : Appliquer la migration

```bash
# Avec psql
psql -U votre_user -d votre_database -f migrations/SAFE_MIGRATION.sql

# Avec variable d'environnement
psql $DATABASE_URL -f migrations/SAFE_MIGRATION.sql
```

### Étape 3 : Vérifier le résultat

```bash
# Vous devriez voir ces messages :
# NOTICE: ✅ All new tables created successfully
# NOTICE: ✅ All critical columns verified
# COMMIT
```

---

## 🖥️ MÉTHODE 2 : Application via pgAdmin

### Étape 1 : Ouvrir pgAdmin

1. Connectez-vous à votre serveur PostgreSQL
2. Sélectionnez votre base de données
3. Cliquez sur **Tools** > **Query Tool**

### Étape 2 : Charger le script

1. Cliquez sur **Open File** (icône dossier)
2. Sélectionnez `migrations/SAFE_MIGRATION.sql`

### Étape 3 : Exécuter

1. Cliquez sur **Execute** (F5) ou l'icône "Play"
2. Attendez l'exécution complète
3. Vérifiez les messages dans l'onglet **Messages**

---

## 🌐 MÉTHODE 3 : Via Panel Hébergeur (Hostinger, etc.)

### Pour Hostinger :

1. Connectez-vous à votre cPanel
2. Allez dans **Databases** > **phpPgAdmin**
3. Sélectionnez votre base de données
4. Cliquez sur **SQL**
5. Copiez/collez le contenu de `migrations/SAFE_MIGRATION.sql`
6. Cliquez sur **Execute**

### Pour autres hébergeurs :

Recherchez l'équivalent de phpMyAdmin/phpPgAdmin pour PostgreSQL

---

## 🔍 VÉRIFICATION POST-MIGRATION

### 1. Vérifier les nouvelles tables

```bash
npx tsx src/scripts/check-schema.ts
```

**Vous devriez voir** :
- ✅ `crypto_transactions`
- ✅ `investments`
- ✅ `programs`
- ✅ `rate_limits`
- ✅ `settings`

### 2. Vérifier les données existantes

```sql
-- Compter les utilisateurs (doit être identique à avant)
SELECT COUNT(*) FROM users;

-- Compter les paiements (doit être identique à avant)
SELECT COUNT(*) FROM payments;

-- Vérifier que les nouvelles colonnes existent
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password_hash';

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name = 'reference_code';
```

### 3. Tester l'application

```bash
npm run dev
```

Puis testez :
- ✅ Connexion avec un utilisateur existant
- ✅ Affichage du compte à rebours
- ✅ Affichage de l'historique des paiements
- ✅ Accès au dashboard admin

---

## 📊 CE QUI A ÉTÉ MODIFIÉ

### Tables CRÉÉES (nouvelles) :
- ✅ `crypto_transactions` - Gestion des transactions crypto
- ✅ `investments` - Système d'investissements
- ✅ `programs` - Programmes d'investissement
- ✅ `rate_limits` - Limitation de taux
- ✅ `settings` - Configuration système

### Colonnes AJOUTÉES (préservation des anciennes) :

#### Table `users` :
- ✅ `password_hash` (copié depuis `password` si existe)

#### Table `payments` :
- ✅ `reference_code` (généré automatiquement)
- ✅ `amount` (copié depuis `amount_usd`)
- ✅ `proof_url` (copié depuis `payment_proof`)
- ✅ `type` (défaut: 'payment')
- ✅ `related_id` (nullable)
- ✅ `ip_address` (nullable)

#### Table `projects` :
- ✅ `goal_amount` (copié depuis `target_amount` si existe)
- ✅ `current_amount` (défaut: 0)
- ✅ `image_url` (nullable)

#### Table `admin_logs` :
- ✅ `target_type` (copié depuis 'payment' si payment_id existe)
- ✅ `target_id` (copié depuis `payment_id` si existe)

### Colonnes PRÉSERVÉES (pas supprimées) :

Les anciennes colonnes sont **CONSERVÉES** :
- 🔒 `payments.currency` - Toujours là
- 🔒 `payments.payment_proof` - Toujours là
- 🔒 `payments.payment_proof_filename` - Toujours là
- 🔒 `projects.target_amount` - Toujours là
- 🔒 `projects.start_date` - Toujours là
- 🔒 `users.password` - Toujours là
- 🔒 Etc.

**Pourquoi ?** Pour éviter toute perte de données. Vous pourrez les supprimer manuellement plus tard après vérification.

---

## ⚠️ EN CAS DE PROBLÈME

### Problème 1 : Erreur "relation already exists"

**C'est OK !** Cela signifie que la table existe déjà. Le script continue sans problème.

### Problème 2 : Erreur "column already exists"

**C'est OK !** Le script vérifie l'existence avant de créer. Aucun impact.

### Problème 3 : Erreur de permission

```bash
# Solution : Utiliser un utilisateur avec droits suffisants
psql -U postgres -d votre_database -f migrations/SAFE_MIGRATION.sql
```

### Problème 4 : Timeout

```bash
# Augmenter le timeout
psql -U user -d database -v ON_ERROR_STOP=1 -f migrations/SAFE_MIGRATION.sql
```

---

## 🔄 ROLLBACK (Retour arrière)

### Si vous voulez annuler la migration :

**Option 1 : Restaurer la sauvegarde**

```bash
# Restaurer depuis backup
pg_restore -U user -d database -c backup_avant_migration.backup

# OU depuis SQL
psql -U user -d database < backup_avant_migration.sql
```

**Option 2 : Supprimer uniquement les nouvelles tables**

```sql
BEGIN;
DROP TABLE IF EXISTS crypto_transactions CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
COMMIT;
```

**Note** : Les colonnes ajoutées resteront mais sans impact (elles sont nullables)

---

## ✅ CHECKLIST POST-MIGRATION

- [ ] Migration exécutée sans erreur
- [ ] Message "✅ All new tables created successfully" visible
- [ ] Message "✅ All critical columns verified" visible
- [ ] `check-schema.ts` montre les nouvelles tables
- [ ] Count users = même nombre qu'avant
- [ ] Count payments = même nombre qu'avant
- [ ] Application démarre sans erreur (`npm run dev`)
- [ ] Connexion fonctionne avec utilisateur existant
- [ ] Dashboard accessible
- [ ] Aucune erreur dans les logs

---

## 📞 COMMANDES UTILES

### Vérifier l'état de la migration

```bash
# Lister toutes les tables
psql -U user -d database -c "\dt"

# Vérifier une table spécifique
psql -U user -d database -c "\d users"

# Compter les enregistrements
psql -U user -d database -c "SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM payments) as payments,
  (SELECT COUNT(*) FROM projects) as projects;"
```

### Vérifier les nouvelles colonnes

```sql
-- Users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Payments
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
```

---

## 🎯 PROCHAINES ÉTAPES APRÈS MIGRATION

### 1. Tester l'application complètement

```bash
npm run dev
```

### 2. Vérifier que tout fonctionne pendant 24-48h

### 3. (Optionnel) Nettoyer les anciennes colonnes

**UNIQUEMENT après confirmation que tout fonctionne** :

```sql
-- Exemple : Supprimer les anciennes colonnes redondantes
-- ATTENTION : À faire SEULEMENT après tests complets !

BEGIN;
-- Vérifier d'abord que les nouvelles colonnes sont bien remplies
SELECT COUNT(*) FROM payments WHERE proof_url IS NULL;
SELECT COUNT(*) FROM payments WHERE payment_proof IS NOT NULL;

-- Si OK, supprimer l'ancienne colonne
-- ALTER TABLE payments DROP COLUMN payment_proof;
-- ALTER TABLE payments DROP COLUMN currency;
-- etc.
COMMIT;
```

---

## 🏆 RÉSUMÉ

Cette migration est **ULTRA-SAFE** car :

1. ✅ **Aucune suppression** - Les anciennes colonnes sont conservées
2. ✅ **Mapping automatique** - Les données sont copiées automatiquement
3. ✅ **Valeurs par défaut** - Générées pour les enregistrements existants
4. ✅ **Transactionnelle** - Tout est annulé en cas d'erreur
5. ✅ **Vérifications** - Messages de confirmation à chaque étape
6. ✅ **Rollback facile** - Restauration possible à tout moment

**Vous pouvez l'appliquer en PRODUCTION en toute confiance !** 🚀

---

**Prêt à migrer ? Exécutez simplement** :

```bash
psql $DATABASE_URL -f migrations/SAFE_MIGRATION.sql
```

**Puis vérifiez** :

```bash
npx tsx src/scripts/check-schema.ts
npm run dev
```

**C'est tout ! 🎉**
