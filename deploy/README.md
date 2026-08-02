# ChallanOne VPS deploy guide (InterServer Ubuntu)
# VPS IP: 173.214.169.166
# Repo:  https://github.com/MohitShishodia/ChallanOne.git

## DNS (do this first)

In your domain DNS, create A records pointing to `173.214.169.166`:

| Host  | Type | Value           |
|-------|------|-----------------|
| @     | A    | 173.214.169.166 |
| www   | A    | 173.214.169.166 |
| api   | A    | 173.214.169.166 |
| admin | A    | 173.214.169.166 |

Wait until they resolve:

```bash
dig +short challanone.com
dig +short api.challanone.com
dig +short admin.challanone.com
```

## 1) SSH into VPS

```bash
ssh root@173.214.169.166
```

## 2) First-time setup

```bash
# If repo is not on server yet, clone temporarily then run setup
cd /tmp
git clone https://github.com/MohitShishodia/ChallanOne.git
bash /tmp/ChallanOne/deploy/setup-vps.sh
```

## 3) Create server/.env

```bash
nano /var/www/challanone/server/.env
```

Paste production values (MongoDB, JWT, Razorpay, APIClub, ChallanWala), then:

```env
PORT=5000
NODE_ENV=production
```

## 4) Enable Nginx sites

```bash
cp /var/www/challanone/deploy/nginx/*.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/api.challanone.com.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/challanone.com.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/admin.challanone.com.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## 5) Deploy app

```bash
su - challanone
cd /var/www/challanone
bash deploy/deploy.sh
pm2 startup
# run the command it prints, then:
pm2 save
exit
```

## 6) HTTPS (after DNS works)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx \
  -d challanone.com -d www.challanone.com \
  -d api.challanone.com \
  -d admin.challanone.com
```

## 7) Verify

```bash
curl -fsS https://api.challanone.com/api/health
# open https://challanone.com
# open https://admin.challanone.com
```

## Later updates

```bash
ssh root@173.214.169.166
su - challanone
cd /var/www/challanone
bash deploy/deploy.sh
```

## Logs

```bash
pm2 logs challanone-api
pm2 status
```
