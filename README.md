# IT Helpdesk

Full-stack helpdesk system with AI assistant, AD/LDAP, Microsoft 365 OAuth, Teams integration, Knowledge Base, and CSAT ratings.

## Stack

- **Backend:** Laravel 11, PHP 8.3, PostgreSQL 16
- **Frontend:** React 19, TypeScript, Vite 8
- **Auth:** Local password + LDAP/AD + Microsoft 365 OAuth
- **Notifications:** Email (SMTP), Teams webhooks, in-app

## Features

- Ticket lifecycle (create, assign, status workflow)
- AI assistant (Bender Rodriguez) for keyword matching & auto-assignment
- Knowledge Base with categories
- User cabinet with ticket history
- CSAT (1-5 stars) after ticket resolution
- Comments with image paste support
- SLA auto-calculation (priority-based deadlines)
- i18n: Ukrainian, English, Polish
- Dark/light theme (Bitrix24 blue)
- Admin panel: users, categories, keyword rules, settings
- Queue worker for email/push notifications

## Quick Install (Ubuntu 24.04)

```bash
bash <(curl -sL https://raw.githubusercontent.com/stek-ops/bender_helpdesk/master/install.sh)
```

The script installs all dependencies, configures Nginx + SSL, sets up PostgreSQL, and builds the frontend.

## Manual Setup

```bash
cd /var/www/helpdesk
cd backend && composer install && php artisan migrate
cd ../frontend && npm install && npx vite build
```

Configure `.env` (DB, mail, OAuth keys), point Nginx to `backend/public` for API and `frontend/dist` for SPA.

## Environment Variables

| Variable | Description |
|---|---|
| `APP_URL` | Public HTTPS URL |
| `DB_*` | PostgreSQL connection |
| `MAIL_*` | SMTP settings |
| `LDAP_*` | LDAP/AD server settings |
| `TEAMS_WEBHOOK_URL` | Teams incoming webhook |
| `MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET` | M365 OAuth |

## License

MIT
