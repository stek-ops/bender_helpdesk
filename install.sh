#!/bin/bash
set -e

# ===== IT Helpdesk — Fresh Ubuntu Install Script =====
# Usage: bash install_helpdesk.sh
# Tested on: Ubuntu 24.04 LTS

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

if [ "$EUID" -eq 0 ]; then err "Do not run as root. Run as a regular user with sudo access."; fi

# ===== CONFIGURATION (edit or leave defaults) =====
REPO_URL="https://github.com/stek-ops/bender_helpdesk.git"
INSTALL_DIR="/var/www/helpdesk"
DB_NAME="helpdesk"
DB_USER="helpdesk"
DB_PASS="helpdesk123"
PHP_VERSION="8.3"
NODE_MAJOR="22"

# ===== PROMPTS =====
read -rp "Domain (e.g. example.com): " APP_DOMAIN
[ -z "$APP_DOMAIN" ] && err "Domain is required"
read -rp "App name [IT Helpdesk]: " APP_NAME
APP_NAME="${APP_NAME:-IT Helpdesk}"
read -rp "PostgreSQL database name [$DB_NAME]: " DB_NAME_IN
DB_NAME="${DB_NAME_IN:-$DB_NAME}"
read -rp "PostgreSQL user [$DB_USER]: " DB_USER_IN
DB_USER="${DB_USER_IN:-$DB_USER}"
read -rsp "PostgreSQL password [$DB_PASS]: " DB_PASS_IN
echo
DB_PASS="${DB_PASS_IN:-$DB_PASS}"
read -rp "Email from address [helpdesk@$APP_DOMAIN]: " MAIL_FROM
MAIL_FROM="${MAIL_FROM:-helpdesk@$APP_DOMAIN}"


# ===== SYSTEM PACKAGES =====
info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

info "Installing dependencies..."
sudo apt install -y curl wget gnupg2 ca-certificates lsb-release ubuntu-keyring \
  nginx postgresql postgresql-client \
  php$PHP_VERSION-fpm php$PHP_VERSION-cli php$PHP_VERSION-common \
  php$PHP_VERSION-pgsql php$PHP_VERSION-mbstring php$PHP_VERSION-xml \
  php$PHP_VERSION-curl php$PHP_VERSION-zip php$PHP_VERSION-bcmath \
  php$PHP_VERSION-gd php$PHP_VERSION-imagick redis-server supervisor unzip git

ok "System packages installed"

# ===== NODE.JS =====
if ! command -v node &>/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]; then
  info "Installing Node.js $NODE_MAJOR..."
  curl -fsSL https://deb.nodesource.com/setup_$NODE_MAJOR.x | sudo -E bash -
  sudo apt install -y nodejs
fi
ok "Node.js $(node -v), npm $(npm -v)"

# ===== COMPOSER =====
if ! command -v composer &>/dev/null; then
  info "Installing Composer..."
  EXPECTED_CHECKSUM="$(php -r 'copy("https://composer.github.io/installer.sig", "php://stdout");')"
  php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
  ACTUAL_CHECKSUM="$(php -r "echo hash_file('sha384', 'composer-setup.php');")"
  [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ] && err "Composer installer corrupted"
  php composer-setup.php --install-dir=/usr/local/bin --filename=composer
  rm composer-setup.php
fi
ok "Composer $(composer -V 2>&1 | awk '{print $3}')"

# ===== CLONE REPO =====
if [ -d "$INSTALL_DIR" ]; then
  warn "Directory $INSTALL_DIR already exists — pulling latest..."
  cd "$INSTALL_DIR" && git pull
else
  info "Cloning repository..."
  sudo mkdir -p "$INSTALL_DIR"
  sudo chown "$USER:$USER" "$INSTALL_DIR"
  git clone "$REPO_URL" "$INSTALL_DIR"
fi
ok "Repository cloned"

# ===== DATABASE =====
info "Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || warn "Database $DB_NAME already exists"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || warn "User $DB_USER already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
sudo -u postgres psql -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null
ok "PostgreSQL configured"

# ===== .ENV =====
cd "$INSTALL_DIR"
if [ -f backend/.env ]; then
  warn "backend/.env already exists — skipping"
else
  info "Creating backend/.env..."
  cat > backend/.env <<ENVFILE
APP_NAME="$APP_NAME"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_URL=https://$APP_DOMAIN
APP_FRONTEND_URL=https://$APP_DOMAIN

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=$DB_NAME
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASS

SESSION_DRIVER=database

MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=$MAIL_FROM
MAIL_FROM_NAME="\$APP_NAME"

LOG_CHANNEL=stack
LOG_LEVEL=warning
ENVFILE
fi
ok "Environment configured"

# ===== PHP DEPENDENCIES =====
info "Installing PHP dependencies..."
mkdir -p "$INSTALL_DIR/backend/bootstrap/cache"
sudo chmod -R 775 "$INSTALL_DIR/backend/bootstrap/cache"
cd "$INSTALL_DIR/backend" && composer install --no-dev --optimize-autoloader
ok "Composer install done"

# ===== APP KEY =====
cd "$INSTALL_DIR/backend"
if grep -q "APP_KEY=base64:" .env 2>/dev/null; then
  warn "APP_KEY already set"
else
  php artisan key:generate
fi
ok "APP_KEY generated"

# ===== MIGRATIONS =====
info "Running migrations..."
cd "$INSTALL_DIR/backend"
php artisan migrate --force
ok "Migrations done"

# ===== STORAGE LINK =====
php artisan storage:link 2>/dev/null || true

# ===== CACHE =====
php artisan route:cache 2>/dev/null || php artisan route:clear
php artisan config:cache 2>/dev/null || php artisan config:clear

# ===== FRONTEND =====
info "Installing frontend dependencies..."
cd "$INSTALL_DIR/frontend" && npm install
ok "npm install done"

info "Building frontend..."
npx vite build
ok "Frontend built"

# ===== PERMISSIONS =====
info "Setting permissions..."
sudo chown -R www-data:www-data "$INSTALL_DIR/backend/storage"
sudo chown -R www-data:www-data "$INSTALL_DIR/backend/bootstrap/cache"
sudo chmod -R 775 "$INSTALL_DIR/backend/storage"
sudo chmod -R 775 "$INSTALL_DIR/backend/bootstrap/cache"
ok "Permissions set"

# ===== NGINX =====
info "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/helpdesk > /dev/null <<NGINX
server {
    server_name $APP_DOMAIN;

    root $INSTALL_DIR/backend/public;

    location /api/ {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \\.php\$ {
        fastcgi_pass unix:/var/run/php/php$PHP_VERSION-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$request_filename;
        include fastcgi_params;
    }

    location /storage/ {
        alias $INSTALL_DIR/backend/storage/app/public/;
    }

    location / {
        root $INSTALL_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    listen 80;
}
NGINX

sudo ln -sf /etc/nginx/sites-available/helpdesk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
ok "Nginx configured (HTTP only)"

# ===== SSL (Let's Encrypt) =====
info "Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx 2>/dev/null
if sudo certbot --nginx -d "$APP_DOMAIN" --non-interactive --agree-tos --email "admin@$APP_DOMAIN" -m "admin@$APP_DOMAIN" 2>/dev/null; then
  ok "SSL certificate obtained"
else
  warn "SSL setup skipped or failed. Run manually: sudo certbot --nginx -d $APP_DOMAIN"
fi

# ===== QUEUE WORKER (Supervisor) =====
info "Setting up queue worker..."
sudo tee /etc/supervisor/conf.d/helpdesk-worker.conf > /dev/null <<SUPERVISOR
[program:helpdesk-worker]
process_name=%(program_name)s_%(process_num)02d
command=php $INSTALL_DIR/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=$INSTALL_DIR/backend/storage/logs/worker.log
stopwaitsecs=3600
SUPERVISOR

sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl start helpdesk-worker:* 2>/dev/null || true
ok "Queue worker configured"

# ===== SUMMARY =====
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Website:   ${CYAN}https://$APP_DOMAIN${NC}"
echo -e "  Backend:   $INSTALL_DIR/backend"
echo -e "  Frontend:  $INSTALL_DIR/frontend"
echo -e "  Database:  $DB_NAME on PostgreSQL 16"
echo -e "  PHP:       $PHP_VERSION, Node: $(node -v)"
echo -e ""
echo -e "  ${YELLOW}First user:${NC} Register via the web UI, then set role to 'admin'"
echo -e "  in the database: ${CYAN}sudo -u postgres psql -d $DB_NAME -c \"UPDATE users SET role='admin' WHERE email='your@email.com';\"${NC}"
echo -e ""
echo -e "  ${YELLOW}Mail:${NC} Configure SMTP in Admin > Email Settings"
echo -e "  ${YELLOW}LDAP:${NC} Configure in Admin > LDAP Settings"
echo -e "  ${YELLOW}Teams:${NC} Configure in Admin > Teams Settings"
echo -e "  ${YELLOW}M365:${NC} Configure in Admin > Microsoft Settings"
echo -e "${GREEN}========================================${NC}"
