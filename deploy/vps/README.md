# CoreSkils Ubuntu 24.04 VPS deployment

These commands deploy the existing monorepo to `coreskils.org` with Nginx serving the Vite frontend and proxying `/api` to a systemd-managed Node API.

## 1. Point the domain to the VPS

In the DNS panel for `coreskils.org`, create:

- `A` record: host `@` → your VPS IPv4 address
- `A` record: host `www` → your VPS IPv4 address

Remove conflicting old `A`/`AAAA` records. DNS can take time to propagate. Do not enter the VPS dashboard URL in Razorpay; enter `https://coreskils.org` only after HTTPS works.

## 2. First SSH login

From Windows PowerShell:

```powershell
ssh root@YOUR_VPS_IP
```

Use the password from the VPS provider. Do not paste that password into chat or source code.

## 3. Install system packages and Node 22

```bash
apt update && apt upgrade -y
apt install -y git curl nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
corepack enable
corepack prepare pnpm@10.26.1 --activate
```

## 4. Create a restricted app user

```bash
adduser --system --group --home /opt/coreskils coreskils
mkdir -p /opt/coreskils/app /etc/coreskils
chown -R coreskils:coreskils /opt/coreskils
chmod 750 /etc/coreskils
```

## 5. Clone from GitHub

For a public repository:

```bash
sudo -u coreskils git clone https://github.com/abhishekumarsharmaji/ltmplatofm.git /opt/coreskils/app
cd /opt/coreskils/app
sudo -u coreskils git checkout main
```

For a private repository, use a read-only GitHub deploy key rather than putting a GitHub token in a command or file.

## 6. Create PostgreSQL database

Generate a strong database password:

```bash
openssl rand -base64 36
```

Copy the output temporarily, then replace `YOUR_STRONG_DB_PASSWORD` below:

```bash
sudo -u postgres psql
```

Run inside PostgreSQL:

```sql
CREATE USER coreskils WITH ENCRYPTED PASSWORD 'YOUR_STRONG_DB_PASSWORD';
CREATE DATABASE coreskils OWNER coreskils;
\q
```

## 7. Configure production secrets

```bash
cp /opt/coreskils/app/deploy/vps/api.env.example /etc/coreskils/api.env
chmod 600 /etc/coreskils/api.env
nano /etc/coreskils/api.env
```

Fill:

- `DATABASE_URL`: use the database password created above.
- `SESSION_SECRET`: generate with `openssl rand -hex 64`.
- `R2_*`: use the existing Cloudflare R2 bucket/API credentials for uploads and digital files.
- `LIVEKIT_*`: fill only if live classes must work on the VPS.
- `AI_INTEGRATIONS_*`: fill only if AI studio must work on the VPS.

Never copy Replit-only App Storage credentials to the VPS. Standalone hosting must use the configured R2 values.

### Configure LiveKit safely

After cloning or deploying the latest code, run:

```bash
cd /opt/coreskils/app
sudo bash deploy/vps/configure-livekit.sh
```

Enter the WebSocket URL, API key, and API secret from the LiveKit Cloud project settings. The secret input is hidden and is written only to `/etc/coreskils/api.env` with mode `600`. The script restarts the API and verifies its health.

The three LiveKit values enable real-time classroom audio/video. Recording is separate and remains disabled unless LiveKit Egress and `LIVEKIT_RECORDING_FILEPATH` are configured.

## 8. Build and initialise the database

```bash
cd /opt/coreskils/app
corepack enable
sudo -u coreskils pnpm install --frozen-lockfile
sudo -u coreskils pnpm run typecheck
set -a
source /etc/coreskils/api.env
set +a
sudo -u coreskils -E pnpm --filter @workspace/db run push
sudo -u coreskils pnpm --filter @workspace/api-server run build
sudo -u coreskils env PORT=24567 BASE_PATH=/ pnpm --filter @workspace/lms-front run build
```

## 9. Install API and Nginx services

```bash
cp /opt/coreskils/app/deploy/vps/coreskils-api.service /etc/systemd/system/coreskils-api.service
cp /opt/coreskils/app/deploy/vps/coreskils.org.nginx /etc/nginx/sites-available/coreskils.org
ln -sf /etc/nginx/sites-available/coreskils.org /etc/nginx/sites-enabled/coreskils.org
rm -f /etc/nginx/sites-enabled/default
systemctl daemon-reload
systemctl enable --now coreskils-api
nginx -t
systemctl restart nginx
```

Check:

```bash
systemctl status coreskils-api --no-pager
curl http://127.0.0.1:4000/api/healthz
curl -I http://coreskils.org
```

## 10. Firewall and HTTPS

Keep the current SSH session open while enabling the firewall:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
certbot --nginx -d coreskils.org -d www.coreskils.org
systemctl status certbot.timer --no-pager
```

Choose the HTTPS redirect option in Certbot. Afterward verify:

```bash
curl -I https://coreskils.org
curl https://coreskils.org/api/healthz
```

## 11. Future GitHub deployments

For a one-time manual deployment after new code is present on GitHub `main`:

```bash
cd /opt/coreskils/app
chmod +x deploy/vps/deploy.sh
./deploy/vps/deploy.sh --force
```

If it fails, inspect logs before retrying:

```bash
journalctl -u coreskils-api -n 100 --no-pager
tail -n 100 /var/log/nginx/error.log
```

### Automatic GitHub deployments

Install the included systemd timer once:

```bash
cp deploy/vps/coreskils-autodeploy.service /etc/systemd/system/
cp deploy/vps/coreskils-autodeploy.timer /etc/systemd/system/
chmod +x deploy/vps/deploy.sh
systemctl daemon-reload
systemctl enable --now coreskils-autodeploy.timer
systemctl list-timers coreskils-autodeploy.timer
```

The VPS checks GitHub `main` every two minutes. It exits immediately when there is no new commit. When a commit exists it pulls with fast-forward safety, installs from the lockfile, typechecks, updates the database schema, builds both services, restarts the API and verifies health.

Check automatic deployment status:

```bash
systemctl status coreskils-autodeploy.timer --no-pager
journalctl -u coreskils-autodeploy.service -n 100 --no-pager
```

## 12. Razorpay website review checklist

Only submit the site after every URL works over HTTPS:

- `https://coreskils.org/`
- `/about`
- `/contact`
- `/terms`
- `/privacy`
- `/refund-policy`
- `/shipping-delivery`
- `/courses` and `/products` with genuine descriptions
- Visible prices and accurate delivery/refund terms before checkout
- Support email and business identity matching the KYC application

In Razorpay’s **Add Your Website Link** field, enter:

```text
https://coreskils.org
```

Approval remains Razorpay’s decision. Do not claim guaranteed earnings, fake reviews, fake instructor credentials, or misleading discounts.