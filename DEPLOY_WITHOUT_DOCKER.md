# Deploy Without Docker (Backend + Frontend + MySQL)

This guide runs your app directly on the server (no Docker).

## 1. Architecture (No Docker)

- Frontend: static files served by Nginx
- Backend: Node.js process (PM2)
- Database: MySQL or MariaDB service

## 2. Prerequisites

- Ubuntu 22.04/24.04 EC2 instance (or similar Linux VM)
- Domain name (optional but recommended)
- Security Group rules:
  - 22 (SSH) from your IP
  - 80 (HTTP) from public
  - 443 (HTTPS) from public
  - 3306 only if remote DB access is required (usually keep private)

## 3. Install System Packages

```bash
sudo apt update
sudo apt install -y nginx mysql-server git curl
```

Install Node.js LTS (example using NodeSource):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential
node -v
npm -v
```

Install PM2:

```bash
sudo npm install -g pm2
```

## 4. Clone Project

```bash
mkdir -p ~/DOS_APPS
cd ~/DOS_APPS
git clone <YOUR_REPO_URL> planetone
cd ~/DOS_APPS/planetone
```

## 5. Configure MySQL/MariaDB

### 5.1 Secure DB (recommended)

```bash
sudo mysql_secure_installation
```

### 5.2 Create database and app user

```bash
sudo mysql -u root -p
```

Run SQL:

```sql
CREATE DATABASE IF NOT EXISTS PlanetOneDashboard;
CREATE USER IF NOT EXISTS 'planetone_app'@'localhost' IDENTIFIED BY 'CHANGE_THIS_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON PlanetOneDashboard.* TO 'planetone_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 6. Backend Setup (No Docker)

```bash
cd ~/DOS_APPS/planetone/backend
npm install
```

Create backend env in repo root (`~/DOS_APPS/planetone/.env`) using placeholders below:

```dotenv
DATABASE_URL=mysql://planetone_app:CHANGE_THIS_STRONG_PASSWORD@localhost:3306/PlanetOneDashboard
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=PlanetOneDashboard
DB_USER=planetone_app
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
PORT=5040
JWT_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET

AWS_ACCESS_KEY_ID=REPLACE_ME
AWS_SECRET_ACCESS_KEY=REPLACE_ME
AWS_STORAGE_BUCKET_NAME=REPLACE_ME
AWS_S3_REGION_NAME=ap-south-1

EMAIL_HOST=REPLACE_ME
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_USE_SSL=false
EMAIL_HOST_USER=REPLACE_ME
DEFAULT_FROM_EMAIL=REPLACE_ME
ADMIN_EMAIL=REPLACE_ME
EMAIL_HOST_PASSWORD=REPLACE_ME
```

## 7. Run Migrations and Seed

```bash
cd ~/DOS_APPS/planetone/backend
npm run migrate
npm run seed:demo
npm run seed:blocks
```

If you need fake migrations:

```bash
npm run migrate:fake
```

## 8. Start Backend with PM2

```bash
cd ~/DOS_APPS/planetone/backend
pm2 start server.js --name planetone-backend

# Save current PM2 process list
pm2 save

# Configure PM2 to auto-start on reboot
pm2 startup systemd -u $(whoami) --hp $HOME

# Run the sudo command printed by PM2, then save again
pm2 save
```

Why this keeps your app running:

- PM2 daemon keeps `planetone-backend` alive after you close terminal/SSH.
- `pm2 startup` registers PM2 with systemd, so app restarts automatically after reboot.

Quick checks:

```bash
pm2 status
pm2 logs planetone-backend
```

Health check:

```bash
curl http://127.0.0.1:5040/health || curl http://127.0.0.1:5040
```

Logs:

```bash
pm2 logs planetone-backend
```

## 9. Build Frontend

```bash
cd ~/DOS_APPS/planetone/frontend
npm install
npm run build
```

This produces static files under `frontend/dist`.

## 10. Nginx Configuration

Create site file:

```bash
sudo nano /etc/nginx/sites-available/planetone
```

Paste (replace `your-domain.com`):

Note: replace `/home/<your-user>/...` with your actual Linux username.

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /home/<your-user>/DOS_APPS/planetone/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5040/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/planetone /etc/nginx/sites-enabled/planetone
sudo nginx -t
sudo systemctl reload nginx
```

## 11. Enable HTTPS (Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 12. Deployment Updates (No Docker)

```bash
cd ~/DOS_APPS/planetone
git pull

cd backend
npm install
npm run migrate
pm2 restart planetone-backend

cd ../frontend
npm install
npm run build

sudo systemctl reload nginx
```

## 13. Troubleshooting

### DB access denied

- Verify user/password in `.env`
- Verify grants:

```sql
SHOW GRANTS FOR 'planetone_app'@'localhost';
```

### Backend not starting

```bash
pm2 logs planetone-backend
node -e "require('./backend/database'); console.log('db config ok')"
```

### Port conflicts

```bash
sudo lsof -i :5040
sudo lsof -i :80
```

### Migration issues

```bash
cd ~/DOS_APPS/planetone/backend
npm run migrate -- --help
```

## 14. Security Notes

- Never commit real `.env` values.
- Rotate any credentials that were previously exposed.
- Restrict DB access to localhost/private network.
- Use IAM role for EC2 where possible instead of static AWS keys.
