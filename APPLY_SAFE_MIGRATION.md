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

### Commande simple :

```bash
psql $DATABASE_URL -f migrations/SAFE_MIGRATION.sql
```

### Ou avec détails :

```bash
psql -U votre_user -d votre_database -f migrations/SAFE_MIGRATION.sql
```

### Résultat attendu :

```
BEGIN
CREATE TABLE
CREATE TABLE
...
NOTICE: ✅ All new tables created successfully
NOTICE: ✅ All critical columns verified
COMMIT
```

---

## 🖥️ MÉTHODE 2 : Via pgAdmin

1. Ouvrir **Query Tool**
2. **Open File** → `migrations/SAFE_MIGRATION.sql`
3. **Execute (F5)**
4. Vérifier les messages de succès

---

## 🌐 MÉTHODE 3 : Via Panel Hébergeur

1. Accéder à phpPgAdmin / équivalent
2. Sélectionner votre base
3. Onglet **SQL**
4. Copier/coller `migrations/SAFE_MIGRATION.sql`
5. **Execute**

---

## 🔍 VÉRIFICATION POST-MIGRATION

```bash
# Vérifier le schéma
npx tsx src/scripts/check-schema.ts

# Vérifier les données
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payments;"

# Tester l'application
npm run dev
```

---

## 📊 CE QUI A ÉTÉ FAIT

### Nouvelles tables créées :
- ✅ `crypto_transactions`
- ✅ `investments`
- ✅ `programs`
- ✅ `rate_limits`
- ✅ `settings`

### Nouvelles colonnes ajoutées (anciennes PRÉSERVÉES) :
- ✅ `users.password_hash` (copié depuis password)
- ✅ `payments.reference_code` (généré auto)
- ✅ `payments.amount` (copié depuis amount_usd)
- ✅ `payments.proof_url` (copié depuis payment_proof)
- ✅ `projects.goal_amount` (copié depuis target_amount)
- ✅ Et autres...

### Anciennes colonnes CONSERVÉES :
- 🔒 `payments.currency`
- 🔒 `payments.payment_proof`
- 🔒 `projects.target_amount`
- 🔒 `users.password`
- 🔒 Toutes les autres données

---

## ⚠️ DÉPANNAGE

### Erreur "relation already exists"
→ **Normal**, le script gère cela avec `IF NOT EXISTS`

### Erreur "column already exists"
→ **Normal**, le script vérifie avant de créer

### Erreur de permission
```bash
psql -U postgres -d database -f migrations/SAFE_MIGRATION.sql
```

---

## 🔄 ROLLBACK

### Restaurer la sauvegarde :
```bash
pg_restore -U user -d database -c backup_avant_migration.backup
```

### Ou supprimer uniquement les nouvelles tables :
```sql
DROP TABLE IF EXISTS crypto_transactions CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
```

---

## ✅ CHECKLIST

- [ ] Sauvegarde effectuée
- [ ] Migration exécutée sans erreur
- [ ] Messages de succès visibles
- [ ] Nouvelles tables présentes
- [ ] Count users/payments identique
- [ ] Application démarre (`npm run dev`)
- [ ] Connexion fonctionne
- [ ] Dashboard accessible

---

## 🎯 COMMANDE RAPIDE

```bash
# Tout-en-un
psql $DATABASE_URL -f migrations/SAFE_MIGRATION.sql && \
npx tsx src/scripts/check-schema.ts && \
npm run dev
```

---

**Cette migration est 100% SAFE - Vos données sont protégées ! 🛡️**
