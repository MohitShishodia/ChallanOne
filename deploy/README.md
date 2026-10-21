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

Paste production values (MongoDB Atlas, JWT, Razorpay, APIClub, ChallanWala), then:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/challanone?retryWrites=true&w=majority
JWT_SECRET=replace_with_long_random_secret
ADMIN_JWT_SECRET=replace_with_long_random_admin_secret
RAZORPAY_KEY_ID=rzp_live_replace_with_live_key_id
RAZORPAY_KEY_SECRET=replace_with_live_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=replace_with_generated_webhook_secret
APICLUB_API_KEY=replace_with_apiclub_key
CHALLANWALA_TOKEN=replace_with_challanwala_token
```

Use the matching **Live Mode** Key ID and Key Secret from the Razorpay Dashboard in
the deployed server's environment variables. Production checkout rejects test-mode
keys. Never place the Key Secret in the web or mobile app. Successful payments are
recorded in Razorpay Dashboard automatically; configure the account's payment
capture setting there so successful authorizations are captured.

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

## Configure Razorpay Live Webhook

After the API domain has a valid HTTPS certificate and the updated backend is
deployed, create a webhook in the Razorpay Dashboard while **Live Mode** is active:

- Webhook URL: `https://api.challanone.com/api/payment/webhook`
- Active events: `payment.captured` and `payment.failed`
- Secret: generate a strong random value, set the same value as
  `RAZORPAY_WEBHOOK_SECRET` in the VPS server `.env`, then restart the backend.

For example, generate a secret on the VPS with `openssl rand -hex 32`. Enter it in
the Razorpay webhook form and the server environment; never put it in frontend
configuration or commit it. The webhook verifies Razorpay's signature over the
raw request body and safely upserts the captured payment, so duplicate webhook
deliveries do not create duplicate payment records. Failed attempts are also
recorded for admin visibility, while a delayed failure event cannot downgrade a
payment already recorded as successful. Keep the checkout payment signature
verification enabled as well.

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
