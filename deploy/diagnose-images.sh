#!/usr/bin/env bash
# Diagnose why evidence images fail on this machine.
# Usage: bash deploy/diagnose-images.sh

echo "=================================================="
echo " ChallanOne — evidence image connectivity check"
echo "=================================================="
echo ""

echo "--- This server's public IP & location ---"
curl -s --max-time 10 https://ipinfo.io/json 2>/dev/null \
  | tr -d '{}"' | tr ',' '\n' | sed 's/^ *//' \
  | grep -E '^(ip|city|region|country|org)' || echo "  (could not determine)"
echo ""

echo "--- Host reachability ---"
printf "%-34s %-18s %s\n" "HOST" "DNS" "RESULT"
for h in itmschallan.parivahan.gov.in echallan.parivahan.nic.in echallan.parivahan.gov.in; do
  ip=$(getent hosts "$h" 2>/dev/null | awk '{print $1}' | head -1)
  if [ -z "$ip" ]; then
    printf "%-34s %-18s %s\n" "$h" "NO_DNS" "-"
    continue
  fi
  res=$(curl -s -o /dev/null -w "http=%{http_code} time=%{time_total}s" --max-time 15 "https://$h/" 2>&1)
  if [ -z "$res" ] || echo "$res" | grep -q "http=000"; then
    res="BLOCKED / TIMEOUT"
  fi
  printf "%-34s %-18s %s\n" "$h" "$ip" "$res"
done
echo ""

echo "--- Known-good image fetch (proves general connectivity) ---"
curl -s -o /tmp/_ok.png -w "  echallan no_image.png: http=%{http_code} size=%{size_download} time=%{time_total}s\n" \
  --max-time 15 "https://echallan.parivahan.nic.in/assets/img/no_image.png"
echo ""

echo "--- Evidence CDN fetch (the one that matters) ---"
curl -s -o /tmp/_ev.bin -w "  itmschallan root: http=%{http_code} size=%{size_download} time=%{time_total}s\n" \
  --max-time 20 "https://itmschallan.parivahan.gov.in/"
echo ""

echo "--- Optional: test your configured image proxy ---"
if [ -n "$CHALLAN_IMAGE_PROXY" ]; then
  curl -s -o /dev/null -x "$CHALLAN_IMAGE_PROXY" \
    -w "  via CHALLAN_IMAGE_PROXY: http=%{http_code} time=%{time_total}s\n" \
    --max-time 25 "https://itmschallan.parivahan.gov.in/"
else
  echo "  CHALLAN_IMAGE_PROXY not set — skipping"
fi
echo ""

echo "=================================================="
echo " HOW TO READ THIS"
echo "=================================================="
echo " If 'itmschallan' shows BLOCKED/TIMEOUT but 'echallan'"
echo " works, the evidence CDN is filtering this server's IP."
echo " Check the country above — if it is not IN (India),"
echo " move to an Indian VPS or set CHALLAN_IMAGE_PROXY to"
echo " an Indian proxy. That is the only real fix."
echo "=================================================="
