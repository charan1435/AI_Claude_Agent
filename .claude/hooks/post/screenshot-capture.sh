#!/bin/bash
# POST-HOOK: SCREENSHOT CAPTURE
# Takes screenshots of running app after frontend build

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📸 POST-HOOK: screenshot-capture running..."

CURRENT_DIR=".claude/screenshots/feedback/current-state"
ITER_DIR=".claude/screenshots/feedback/iterations"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PORT="${DEV_PORT:-3000}"
BASE_URL="http://localhost:$PORT"

mkdir -p "$CURRENT_DIR" "$ITER_DIR"

# Check if dev server is running
if ! curl -s --head --max-time 3 "$BASE_URL" > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Dev server not running on port $PORT. Skipping capture.${NC}"
  exit 0
fi

PAGES=("/:homepage" "/products:products" "/cart:cart" "/checkout:checkout" "/dashboard:dashboard" "/login:login" "/signup:signup")

if command -v npx &> /dev/null && [ -f "package.json" ]; then
  for entry in "${PAGES[@]}"; do
    PATH_PART="${entry%%:*}"
    NAME_PART="${entry##*:}"
    OUTPUT="$CURRENT_DIR/${NAME_PART}.png"

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$BASE_URL$PATH_PART" 2>/dev/null)

    if [ "$STATUS" = "200" ]; then
      npx playwright screenshot --browser chromium "$BASE_URL$PATH_PART" "$OUTPUT" 2>/dev/null
      if [ -f "$OUTPUT" ]; then
        cp "$OUTPUT" "$ITER_DIR/${TIMESTAMP}_${NAME_PART}.png"
        echo -e "${GREEN}✓ Screenshot: $NAME_PART${NC}"
      fi
    fi
  done
fi

echo -e "${GREEN}✓ SCREENSHOT CAPTURE: Done.${NC}"
exit 0
