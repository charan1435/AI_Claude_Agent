#!/bin/bash
# POST-HOOK: SCREENSHOT COMPARE
# Compares current screenshots against reference screenshots

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 POST-HOOK: screenshot-compare running..."

REF_DIR=".claude/screenshots/reference"
CURRENT_DIR=".claude/screenshots/feedback/current-state"
ITER_DIR=".claude/screenshots/feedback/iterations"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NOTES="$ITER_DIR/${TIMESTAMP}_comparison_notes.md"

mkdir -p "$ITER_DIR"

# No references → skip comparison
if [ -z "$(ls -A $REF_DIR/*.png 2>/dev/null)" ]; then
  echo -e "${YELLOW}⚠️  No reference screenshots. Skipping comparison.${NC}"
  exit 0
fi

echo "# Screenshot Comparison — $TIMESTAMP" > "$NOTES"
echo "" >> "$NOTES"

DIFFS=false

for REF in "$REF_DIR"/*.png; do
  PAGE=$(basename "$REF" .png)
  CURRENT="$CURRENT_DIR/${PAGE}.png"

  echo "## $PAGE" >> "$NOTES"

  if [ ! -f "$CURRENT" ]; then
    echo "- ⚠️  No current screenshot found" >> "$NOTES"
    echo -e "${YELLOW}⚠️  No current screenshot for: $PAGE${NC}"
    echo "" >> "$NOTES"
    continue
  fi

  if command -v compare &> /dev/null; then
    DIFF_IMG="$ITER_DIR/${TIMESTAMP}_diff_${PAGE}.png"
    SCORE=$(compare -metric RMSE "$REF" "$CURRENT" "$DIFF_IMG" 2>&1 | awk '{print $1}')

    echo "- Difference score: $SCORE (threshold: 10)" >> "$NOTES"

    if awk "BEGIN{exit !($SCORE > 10)}" 2>/dev/null; then
      echo "- Status: ❌ Needs fixing" >> "$NOTES"
      echo -e "${RED}❌ $PAGE needs fixing (score: $SCORE)${NC}"
      DIFFS=true
    else
      echo "- Status: ✅ Matches reference" >> "$NOTES"
      echo -e "${GREEN}✅ $PAGE matches reference${NC}"
    fi
  else
    echo "- Status: ⚠️  ImageMagick not installed — manual review needed" >> "$NOTES"
    echo -e "${YELLOW}⚠️  Install ImageMagick for auto pixel comparison${NC}"
  fi

  echo "" >> "$NOTES"
done

echo "## Summary" >> "$NOTES"
if [ "$DIFFS" = true ]; then
  echo "Pages with differences require UI fixes." >> "$NOTES"
  echo -e "${YELLOW}⚠️  Differences found. Review: $NOTES${NC}"
  echo -e "${YELLOW}   Claude should fix UI and rebuild.${NC}"
else
  echo "All pages match reference." >> "$NOTES"
  echo -e "${GREEN}✓ All pages match reference.${NC}"
fi

echo -e "${GREEN}✓ Notes saved: $NOTES${NC}"
exit 0
