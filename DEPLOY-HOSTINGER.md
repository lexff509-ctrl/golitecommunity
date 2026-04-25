# 🚀 Guide de Déploiement — GoLite Community Support sur Hostinger

## Prérequis

- **VPS Hostinger** (Ubuntu 22.04 ou 24.04) — plan KVM 2 minimum (2 Go RAM)
- **Accès SSH** (fourni par Hostinger dans hPanel → VPS → Paramètres)
- **Un nom de domaine** (optionnel mais recommandé)

---

## Étape 1 : Connexion au VPS

```bash
ssh root@VOTRE_IP_VPS
```

Mot de passe fourni par Hostinger dans hPanel → VPS → Paramètres.

---

## Étape 2 : Téléverser le projet

### Option A : Via Git (recommandé)

```bash
# Installer Git si pas encore fait
apt install -y git

# Cloner votre repository
cd /home/deployer
mkdir -p golite && cd golite
git clone VOTRE_URL_REPO.git .

# Ou si le repo est privé :
git clone https://VOTRE_TOKEN@github.com/VOTRE_USER/golite.git .
```

### Option B : Via SCP (depuis votre PC)

```bash
# Depuis votre PC local, dans le dossier du projet :
scp -r ./* root@VOTRE_IP:/home/deployer/golite/
```

### Option C : Via SFTP (hPanel → Gestionnaire de fichiers)

1. Allez dans **hPanel → VPS → Gestionnaire de fichiers**
2. Naviguez vers `/home/deployer/golite`
3. Uploadez tous les fichiers du projet (sauf `.next` et `node_modules`)

---

## Étape 3 : Configurer le nom de domaine (optionnel)

Dans **hPanel → Domaines** :
1. Liez votre domaine au VPS (pointe vers l'IP du VPS)
2. Configurez DNS : créez un enregistrement **A** → IP du VPS

Puis modifiez Nginx :

```bash
nano /etc/nginx/sites-available/golite
```

Remplacez `server_name _;` par :
```nginx
server_name votredomaine.com www.votredomaine.com;
```

Redémarrez Nginx :
```bash
nginx -t && systemctl reload nginx
```

---

## Étape 4 : Activer HTTPS (SSL)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d votredomaine.com -d www.votredomaine.com
```

Suivez les instructions. Le certificat se renouvelle automatiquement.

---

## Étape 5 : Exécuter le script de déploiement

```bash
cd /home/deployer/golite
bash deploy.sh
```

Le script va :
1. ✅ Installer Node.js 20, PM2, Nginx
2. ✅ Installer et configurer PostgreSQL
3. ✅ Créer la base de données
4. ✅ Installer les dépendances npm
5. ✅ Build le projet
6. ✅ Créer le compte admin
7. ✅ Configurer Nginx comme reverse proxy
8. ✅ Démarrer l'app avec PM2

---

## Étape 6 : Vérifier que tout fonctionne

```bash
# Statut de PM2
pm2 status

# Logs en temps réel
pm2 logs golite

# Tester l'API
curl http://localhost:3000/api/health
```

---

## Identifiants par défaut

| | Valeur |
|---|---|
| 🌐 URL | `http://VOTRE_IP` ou `https://votredomaine.com` |
| 📧 Admin | `admin@golite.com` |
| 🔑 Mot de passe | `123456` |

> ⚠️ **Changez le mot de passe admin immédiatement après la première connexion !**

---

## Commandes PM2 utiles

```bash
pm2 status              # Statut des processus
pm2 logs golite         # Voir les logs
pm2 restart golite      # Redémarrer
pm2 stop golite         # Arrêter
pm2 monit               # Monitoring en temps réel
```

---

## Mise à jour du code

```bash
cd /home/deployer/golite

# Pull le dernier code
git pull origin main

# Installer les nouvelles dépendances
npm install --omit=dev

# Rebuild
npm run build

# Appliquer les changements DB (si nécessaires)
npx drizzle-kit push

# Redémarrer
pm2 restart golite
```

---

## Modifier le mot de passe admin

Connectez-vous à PostgreSQL :

```bash
psql postgresql://golite_user:VOTRE_MDP@127.0.0.1:5432/golite_db
```

Ou utilisez un script Node :

```bash
cd /home/deployer/golite
npx tsx -e "
import 'dotenv/config';
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function changePassword(email: string, newPass: string) {
  const hash = await bcrypt.hash(newPass, 10);
  await db.update(users).set({ password: hash }).where(eq(users.email, email));
  console.log('✅ Mot de passe mis à jour pour', email);
}
changePassword('admin@golite.com', 'NOUVEAU_MDP');
"
```

---

## Résolution de problèmes

### L'app ne démarre pas
```bash
pm2 logs golite --lines 50
```

### Erreur de base de données
```bash
# Vérifier que PostgreSQL tourne
systemctl status postgresql

# Tester la connexion
psql postgresql://golite_user:MOT_DE_PASSE@127.0.0.1:5432/golite_db
```

### Le port 80/443 est bloqué
```bash
# Vérifier les règles firewall
ufw status

# Ouvrir les ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
```

### Espace disque insuffisant
```bash
df -h
du -sh /home/deployer/golite/*
```

---

## Structure des fichiers sur le VPS

```
/home/deployer/golite/
├── .env                    # Variables d'env (NE PAS commiter !)
├── .next/                  # Build Next.js (généré)
├── public/uploads/proofs/  # Preuves de paiement uploadées
├── logs/                   # Logs PM2
│   ├── app.log
│   └── error.log
├── ecosystem.config.js     # Config PM2
├── package.json
├── src/                    # Code source
└── deploy.sh               # Script de déploiement
```

---

## Sauvegardes

### Base de données
```bash
pg_dump -U golite_user golite_db > backup_$(date +%Y%m%d).sql
```

### Fichiers uploadés
```bash
tar -czf backup_uploads_$(date +%Y%m%d).tar.gz /home/deployer/golite/public/uploads/
```

### Automatiser les sauvegardes (cron)
```bash
crontab -e
# Ajouter cette ligne (backup quotidien à 3h du matin) :
0 3 * * * pg_dump -U golite_user golite_db | gzip > /home/deployer/backups/golite_$(date +\%Y\%m\%d).sql.gz
```
