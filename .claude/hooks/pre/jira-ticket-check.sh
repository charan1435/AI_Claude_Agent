#!/bin/bash
# PRE-HOOK: JIRA TICKET ID CHECK
# Blocks commits that don't reference a Jira ticket

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "🎫 PRE-HOOK: jira-ticket-check running..."

MSG_FILE="${1:-.git/COMMIT_EDITMSG}"

if [ ! -f "$MSG_FILE" ]; then
  echo -e "${GREEN}✓ JIRA CHECK: No commit message file found. Skipping.${NC}"
  exit 0
fi

MSG=$(cat "$MSG_FILE")
JIRA_PATTERN="[A-Z][A-Z0-9]+-[0-9]+"

if ! echo "$MSG" | grep -qE "$JIRA_PATTERN"; then
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}🚫 JIRA CHECK: COMMIT BLOCKED${NC}"
  echo -e "${RED}   Every commit must include a Jira ticket ID.${NC}"
  echo -e "${RED}   Format: PROJ-123: your description${NC}"
  echo -e "${RED}   Example: PROJ-42: add product listing page${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  exit 1
fi

echo -e "${GREEN}✓ JIRA CHECK: Ticket ID found.${NC}"
exit 0
