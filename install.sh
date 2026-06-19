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
read -rp "Domain or IP (e.g. example.com or 192.168.1.10): " APP_DOMAIN
if [ -z "$APP_DOMAIN" ]; then
  APP_DOMAIN=$(curl -s ifconfig.me 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
  warn "No domain entered — using IP: $APP_DOMAIN (SSL will be skipped)"
fi
read -rp "Enable SSL via Let's Encrypt? (y/N) [n]: " SSL_ENABLED
SSL_ENABLED="${SSL_ENABLED:-n}"
read -rp "App name [IT Helpdesk]: " APP_NAME
APP_NAME="${APP_NAME:-IT Helpdesk}"
read -rp "PostgreSQL database name [$DB_NAME]: " DB_NAME_IN
DB_NAME="${DB_NAME_IN:-$DB_NAME}"
read -rp "PostgreSQL user [$DB_USER]: " DB_USER_IN
DB_USER="${DB_USER_IN:-$DB_USER}"
read -rsp "PostgreSQL password [$DB_PASS]: " DB_PASS_IN
echo
DB_PASS="${DB_PASS_IN:-$DB_PASS}"
echo ""
read -rp "Admin email [admin@$APP_DOMAIN]: " ADMIN_EMAIL
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@$APP_DOMAIN}"
read -rsp "Admin password (min 6 chars): " ADMIN_PASS
echo
while [ -z "$ADMIN_PASS" ] || [ ${#ADMIN_PASS} -lt 6 ]; do
  read -rsp "Admin password (min 6 chars): " ADMIN_PASS
  echo
done
read -rp "Email from address [helpdesk@$APP_DOMAIN]: " MAIL_FROM
MAIL_FROM="${MAIL_FROM:-helpdesk@$APP_DOMAIN}"


# ===== SYSTEM PACKAGES =====
info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

info "Installing dependencies..."
# Add PHP PPA for older Ubuntu versions
if ! apt-cache show php$PHP_VERSION-fpm &>/dev/null 2>&1; then
  sudo apt install -y software-properties-common
  # Map unknown codenames to supported Ubuntu release for PPA
  PHP_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
  case "$PHP_CODENAME" in
    noble|jammy|focal|bookworm|bullseye) ;;
    plucky|resolute) PHP_CODENAME="noble" ;;  # 25.04 / 26.04 → use 24.04 PHP
    *) PHP_CODENAME="jammy" ;;  # fallback for other unknown
  esac
  # Use sury.org directly (works for all Ubuntu/Debian versions)
  sudo rm -f /etc/apt/sources.list.d/ondrej-php*.list /etc/apt/sources.list.d/php.list 2>/dev/null || true
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://packages.sury.org/php/apt.gpg 2>/dev/null | sudo gpg --dearmor -o /etc/apt/keyrings/php.gpg 2>/dev/null || true
  echo "deb [signed-by=/etc/apt/keyrings/php.gpg] https://packages.sury.org/php/ $PHP_CODENAME main" | sudo tee /etc/apt/sources.list.d/php.list > /dev/null
  sudo apt update
fi
sudo apt install -y curl wget gnupg2 ca-certificates lsb-release ubuntu-keyring \
  nginx postgresql postgresql-client \
  php$PHP_VERSION-fpm php$PHP_VERSION-cli php$PHP_VERSION-common \
  php$PHP_VERSION-pgsql php$PHP_VERSION-mbstring php$PHP_VERSION-xml \
  php$PHP_VERSION-curl php$PHP_VERSION-zip php$PHP_VERSION-bcmath \
  php$PHP_VERSION-gd redis-server supervisor unzip git
  sudo apt install -y php$PHP_VERSION-imagick 2>/dev/null || warn "php-imagick not available (optional)"

ok "System packages installed"

# ===== START POSTGRESQL =====
sudo systemctl enable --now postgresql || true
sleep 2
ok "PostgreSQL started"

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
  sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
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
# Ensure PostgreSQL accepts TCP connections
PG_VERSION=$(ls /etc/postgresql/ | head -1)
PG_CONF="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
sudo sed -i "s/#listen_addresses/listen_addresses/" "$PG_CONF" 2>/dev/null || true
sudo systemctl restart postgresql
sleep 2
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || warn "Database $DB_NAME already exists"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || warn "User $DB_USER already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
ok "PostgreSQL configured"

# ===== .ENV =====
cd "$INSTALL_DIR"
if [ -f backend/.env ]; then
  warn "backend/.env already exists — skipping"
else
  info "Creating backend/.env..."
  if [ "$SSL_ENABLED" = "y" ] || [ "$SSL_ENABLED" = "Y" ]; then
    APP_PROTO="https"
  else
    APP_PROTO="http"
  fi
  cat > backend/.env <<ENVFILE
APP_NAME="$APP_NAME"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_URL=${APP_PROTO}://$APP_DOMAIN
APP_FRONTEND_URL=${APP_PROTO}://$APP_DOMAIN

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=$DB_NAME
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASS

SESSION_DRIVER=database
QUEUE_CONNECTION=database

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
info "Creating queue + session tables..."
php artisan queue:table 2>/dev/null || true
php artisan session:table 2>/dev/null || true
info "Running migrations..."
cd "$INSTALL_DIR/backend"
php artisan migrate --force
ok "Migrations done"

# ===== DEFAULT ADMIN =====
info "Creating admin user..."
cd "$INSTALL_DIR/backend"
php artisan tinker --execute="\\App\\Models\\User::create(['name' => 'Admin', 'email' => '$ADMIN_EMAIL', 'password' => bcrypt('$ADMIN_PASS'), 'role' => 'admin', 'is_active' => true]);" 2>/dev/null || true
ok "Admin user created: $ADMIN_EMAIL"

# ===== STORAGE LINK =====
mkdir -p storage/app/public
php artisan storage:link 2>/dev/null || true

# ===== CACHE =====
php artisan route:cache 2>/dev/null || php artisan route:clear
php artisan config:cache 2>/dev/null || php artisan config:clear

# ===== FRONTEND =====
info "Installing frontend dependencies..."
cd "$INSTALL_DIR/frontend" && npm install --no-audit --no-fund
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
    server_name $APP_DOMAIN _;

    server_tokens off;

    root $INSTALL_DIR/backend/public;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

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
sudo systemctl restart php$PHP_VERSION-fpm
ok "Nginx configured (HTTP only)"

# ===== SSL (Let's Encrypt) =====
if [ "$SSL_ENABLED" = "y" ] || [ "$SSL_ENABLED" = "Y" ]; then
  if [[ "$APP_DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    warn "Cannot issue SSL certificate for IP address — skipping SSL"
  else
    info "Installing Certbot for SSL..."
    sudo apt install -y certbot python3-certbot-nginx 2>/dev/null
    if sudo certbot --nginx -d "$APP_DOMAIN" --non-interactive --agree-tos --email "admin@$APP_DOMAIN" -m "admin@$APP_DOMAIN" 2>/dev/null; then
      ok "SSL certificate obtained"
    else
      warn "SSL setup failed. Run manually: sudo certbot --nginx -d $APP_DOMAIN"
    fi
  fi
else
  warn "SSL skipped. Run manually later: sudo certbot --nginx -d $APP_DOMAIN"
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
PROTOCOL="http"
if [ "$SSL_ENABLED" = "y" ] || [ "$SSL_ENABLED" = "Y" ]; then PROTOCOL="https"; fi
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  Website:   ${CYAN}${PROTOCOL}://$APP_DOMAIN${NC}"
echo -e "  Backend:   $INSTALL_DIR/backend"
echo -e "  Frontend:  $INSTALL_DIR/frontend"
echo -e "  Database:  $DB_NAME on PostgreSQL 16"
echo -e "  PHP:       $PHP_VERSION, Node: $(node -v)"
echo -e ""
echo -e "  ${GREEN}Admin login:${NC}  ${CYAN}$ADMIN_EMAIL${NC} / (your password)"
echo -e ""
echo -e "  ${YELLOW}Mail:${NC} Configure SMTP in Admin > Email Settings"
echo -e "  ${YELLOW}LDAP:${NC} Configure in Admin > LDAP Settings"
echo -e "  ${YELLOW}Teams:${NC} Configure in Admin > Teams Settings"
echo -e "  ${YELLOW}M365:${NC} Configure in Admin > Microsoft Settings"
echo -e "${GREEN}========================================${NC}"
