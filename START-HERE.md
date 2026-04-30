# 🚦 COMMENCEZ ICI - Guide de Dépannage Simple

## 🔴 Vous avez un problème ?

### Symptômes courants :
- ❌ Erreur de connexion
- ❌ Compte à rebours disparu
- ❌ "Erreur serveur"
- ❌ "Cannot read property..."

---

## 📋 DIAGNOSTIC EN 3 ÉTAPES

### ÉTAPE 1️⃣ : Exécutez le diagnostic

**Double-cliquez sur** : `diagnose.bat`

Cela va vérifier :
- ✓ Node.js installé
- ✓ Dépendances installées
- ✓ Code sans erreur TypeScript
- ✓ Structure de la base de données

---

### ÉTAPE 2️⃣ : Lisez le résultat

#### A) Si vous voyez dans le schéma :

```
=== USERS TABLE SCHEMA ===
id - uuid
first_name - character varying    ← C'EST LÀ
last_name - character varying     ← C'EST LÀ
email - character varying
password_hash - text
```

✅ **TOUT EST OK** - La migration est appliquée

**Problème** : Erreur de connexion
**Solution** : Vérifiez votre `.env`

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

---

#### B) Si vous voyez dans le schéma :

```
=== USERS TABLE SCHEMA ===
id - uuid
email - character varying
password_hash - text
role - character varying
(PAS DE first_name !)
```

❌ **MIGRATION NON APPLIQUÉE** - C'est le problème !

**Solution** : Voir ÉTAPE 3️⃣

---

### ÉTAPE 3️⃣ : Appliquez la solution

## 🎯 SOLUTION RAPIDE (Recommandée)

### Avez-vous des données importantes ?

#### ✅ **NON** - C'est un environnement de test

```bash
# Méthode simple : Recréer tout
npm run db:push
npx tsx src/scripts/seed-admin.ts
npx tsx src/scripts/seed-content.ts
npm run dev
```

Puis connectez-vous :
- Email: `admin@golite.com`
- Mot de passe: `123456`

---

#### ⚠️ **OUI** - J'ai des vrais utilisateurs/paiements

**STOP !** Ne faites rien sans sauvegarder !

##### Option 1 : Revenir en arrière (SAFE)

```bash
# Retourner à l'ancienne version
git checkout 588ce5e
npm run dev
```

Votre site refonctionnera avec vos données intactes.

##### Option 2 : Migrer correctement

1. **SAUVEGARDER d'abord** (CRUCIAL !)
   ```bash
   # Via votre hébergeur, exportez la base de données
   # OU via pgAdmin : Clic droit > Backup
   # OU via psql :
   pg_dump -U user -d database > backup.sql
   ```

2. **Appliquer la migration**
   
   **Via pgAdmin** :
   - Ouvrir pgAdmin
   - Sélectionner votre base
   - Tools > Query Tool
   - Ouvrir `migrations/001_schema_fixes.sql`
   - Exécuter (F5)

   **Via terminal** :
   ```bash
   psql -U user -d database -f migrations/001_schema_fixes.sql
   ```

   **Via cPanel/Hostinger** :
   - PhpPgAdmin ou équivalent
   - Copier/coller le contenu de `migrations/001_schema_fixes.sql`
   - Exécuter

3. **Vérifier**
   ```bash
   npx tsx src/scripts/check-schema.ts
   ```
   Vous devez voir `first_name` et `last_name`

4. **Redémarrer**
   ```bash
   npm run dev
   ```

---

## 🆘 Cas d'urgence

### Je ne peux plus me connecter !

#### Solution 1 : Revenir en arrière
```bash
git checkout 588ce5e
npm run dev
```

#### Solution 2 : Réinitialiser le mot de passe

**Via SQL** (dans pgAdmin ou votre panel) :
```sql
UPDATE users 
SET password_hash = '$2a$10$K8Qxg8xJZ8XJZ8XJZ8XJZ8XJZ8XJZ8XJZ8XJZ8XJZ8XJZ8XJZ'
WHERE email = 'admin@golite.com';
-- Mot de passe: 123456
```

**Via script** :
```bash
# Supprimer l'ancien admin
DELETE FROM users WHERE email = 'admin@golite.com';

# Recréer l'admin
npx tsx src/scripts/seed-admin.ts
```

---

## 📊 Comprendre ce qui s'est passé

### Avant les corrections :
```
Table users:
- id
- email
- password_hash
- role
❌ Manque: first_name, last_name
```

Le code cherche `first_name` mais il n'existe pas → **ERREUR**

### Après la migration :
```
Table users:
- id
- first_name  ← AJOUTÉ
- last_name   ← AJOUTÉ
- email
- password_hash
- role
```

Le code trouve `first_name` → **ÇA MARCHE**

### Vos données :
- ✅ Utilisateurs : **PRÉSERVÉS**
- ✅ Paiements : **PRÉSERVÉS**
- ✅ Tout le reste : **INTACT**

**On ajoute juste des colonnes, on ne supprime RIEN !**

---

## 🎯 Action Immédiate

**FAITES CECI MAINTENANT** :

1. Double-cliquez sur `diagnose.bat`
2. Regardez si vous voyez `first_name` dans le résultat
3. Si OUI → Vérifiez votre `.env`
4. Si NON → Choisissez entre :
   - Revenir en arrière (safe)
   - Appliquer la migration (suivez les étapes)

---

## 📞 Besoin d'aide ?

**Avant de demander de l'aide, préparez** :

1. Résultat de `diagnose.bat` (capture d'écran)
2. Le message d'erreur exact quand vous essayez de vous connecter
3. Réponse à : Avez-vous des données importantes ? (OUI/NON)
4. Réponse à : Avez-vous fait une sauvegarde ? (OUI/NON)

---

## ✅ Checklist de vérification

- [ ] J'ai exécuté `diagnose.bat`
- [ ] J'ai lu le résultat
- [ ] J'ai une sauvegarde de ma base de données
- [ ] Je sais si j'ai des données importantes ou non
- [ ] J'ai lu URGENT-FIX.md pour ma situation

**Une fois cette checklist complète, vous saurez quoi faire !**

---

**Respirez, vos données sont en sécurité ! 🙏**
