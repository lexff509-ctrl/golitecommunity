#!/bin/bash
# ============================================================
# GoLite Community Support — Script de déploiement Hostinger VPS
# ============================================================
# Ce script configure un VPS Hostinger Ubuntu pour Next.js + PostgreSQL
# Exécuter en tant que root ou avec sudo
# ============================================================

set -e

APP_DIR="/home/deployer/golite"
DB_NAME="golite_db"
DB_USER="golite_user"
DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
ADMIN_EMAIL="admin@golite.com"
ADMIN_PASS="123456"

echo "=========================================="
echo " 🚀 GoLite — Déploiement Hostinger VPS"
echo "=========================================="
echo ""

# ── 1. Mise à jour du système ────────────────
echo "📦 [1/8] Mise à jour du système..."
apt update -y && apt upgrade -y

# ── 2. Installation des dépendances ──────────
echo "📦 [2/8] Installation de Node.js 20, Git, PM2..."
apt install -y curl git build-essential

# Node.js 20 LTS
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

echo "Node: $(node -v) | npm: $(npm -v)"

# PM2 global
npm install -g pm2
pm2 startup

# ── 3. Installation PostgreSQL ───────────────
echo "🐘 [3/8] Installation de PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Créer la base de données et l'utilisateur
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;" 2>/dev/null || true

# ── 4. Configuration PostgreSQL pour auth ────
echo "🔐 [4/8] Configuration de l'authentification..."
PG_HBA="/etc/postgresql/*/main/pg_hba.conf"
PG_HBA_PATH=$(ls /etc/postgresql/*/main/pg_hbla.conf 2>/dev/null || ls /etc/postgresql/*/main/pg_hba.conf 2>/dev/null | head -1)

if [ -n "$PG_HBA_PATH" ]; then
  # Permettre la connexion avec mot de passe
  sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" "$PG_HBA_PATH" 2>/dev/null || true
  systemctl restart postgresql
fi

# ── 5. Créer le répertoire de l'app ─────────
echo "📁 [5/8] Préparation du répertoire..."
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/logs"
mkdir -p "$APP_DIR/public/uploads/proofs"

# ── 6. Configuration .env ────────────────────
echo "⚙️  [6/8] Configuration des variables d'environnement..."
cat > "$APP_DIR/.env" << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME
NODE_ENV=production
EOF

echo ""
echo "┌─────────────────────────────────────────────┐"
echo " │  📋 Informations de connexion Base de Données │"
echo " ├─────────────────────────────────────────────┤"
echo " │  Base :  $DB_NAME"
echo " │  User :  $DB_USER"
echo " │  Pass :  $DB_PASS"
echo " └─────────────────────────────────────────────┘"
echo ""

# ── 7. Copier les fichiers (si dans un repo) ─
echo "📥 [7/8] Installation des fichiers..."
cd "$APP_DIR"

# Si les fichiers sont déjà présents (déploiement Git)
if [ -f "package.json" ]; then
  echo "Fichiers déjà présents, installation des dépendances..."
  npm install --omit=dev
else
  echo "⚠️  Les fichiers source ne sont pas encore présents."
  echo "   Copiez votre projet dans $APP_DIR puis relancez ce script."
  echo "   Ou clonez votre repo Git ici."
fi

# ── 8. Build et démarrage ────────────────────
echo "🏗️  [8/8] Build et démarrage..."
if [ -f "package.json" ]; then
  npm run build

  # Push le schema Drizzle
  npx drizzle-kit push 2>/dev/null || echo "⚠️  Drizzle push échoué — à faire manuellement"

  # Seed admin
  npx tsx src/scripts/seed-admin.ts 2>/dev/null || echo "⚠️  Seed admin échoué — à faire manuellement"

  # Démarrer avec PM2
  pm2 delete golite 2>/dev/null || true
  pm2 start ecosystem.config.js
  pm2 save
fi

# ── 9. Configuration Nginx (reverse proxy) ───
echo "🌐 Configuration de Nginx..."
apt install -y nginx

cat > /etc/nginx/sites-available/golite << 'NGINX'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/golite /etc/nginx/sites-enabled/golite
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
systemctl enable nginx

# ── Résumé ───────────────────────────────────
echo ""
echo "=========================================="
echo " ✅ DÉPLOIEMENT TERMINÉ !"
echo "=========================================="
echo ""
echo " 🌐 Site :     http://VOTRE_IP"
echo " 📧 Admin :    $ADMIN_EMAIL"
echo " 🔑 Mot de passe : $ADMIN_PASS"
echo ""
echo " 📂 Fichiers : $APP_DIR"
echo " 📊 Logs :     $APP_DIR/logs/"
echo ""
echo " 🔧 Commandes utiles :"
echo "   pm2 status          — Statut de l'app"
echo "   pm2 logs golite     — Voir les logs"
echo "   pm2 restart golite  — Redémarrer"
echo ""
echo " ⚠️  IMPORTANT : Changez le mot de passe admin en prod !"
echo "=========================================="
