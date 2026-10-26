#!/bin/sh
# Booking-card totals from the live API. The key is read from the private file
# on Joey's Mac (~/.amber/metrics-read-key) and never printed.
# Usage: scripts/metrics-summary.sh [days]   (default 30)
DAYS="${1:-30}"
KEY_FILE="$HOME/.amber/metrics-read-key"
[ -r "$KEY_FILE" ] || { echo "Missing $KEY_FILE" >&2; exit 1; }
curl -s -H "x-amber-metrics-key: $(cat "$KEY_FILE")" \
  "https://amber-backend-seven.vercel.app/api/metrics/booking-card/summary?days=$DAYS"
echo
