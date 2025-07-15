# /checkSecurity

Validate security requirements for an issue

## Usage
```
/checkSecurity ISSUE-XXX
```

## Description
Validates security compliance for an issue by checking for security-related acceptance criteria, KERI edge protection requirements, transport security, and audit logging requirements.

## Implementation
```bash
# Validate security requirements for an issue
ISSUE_ID="$1"
if [ -z "$ISSUE_ID" ]; then
    echo "Usage: /checkSecurity ISSUE-XXX"
    exit 1
fi

ISSUE_FILE=$(find ../product-owner/ProjectMgmt/{open,wip,closed}/ -name "*$ISSUE_ID*.md" 2>/dev/null)
if [ -z "$ISSUE_FILE" ]; then
    echo "Issue $ISSUE_ID not found"
    exit 1
fi

echo "=== SECURITY COMPLIANCE CHECK ==="
echo "Issue: $ISSUE_ID"
echo "File: $ISSUE_FILE"

echo -e "\n=== SECURITY ACCEPTANCE CRITERIA ==="
grep -A 20 "## Acceptance Criteria" "$ISSUE_FILE" | grep -E "(security|private key|TLS|encryption|authentication|authorization|audit)"

echo -e "\n=== KERI EDGE PROTECTION CHECK ==="
if grep -q "edge protection\|private key\|never leave" "$ISSUE_FILE"; then
    echo "✓ KERI edge protection requirements found"
else
    echo "⚠ KERI edge protection requirements not specified"
fi

echo -e "\n=== TRANSPORT SECURITY CHECK ==="
if grep -q "TLS\|transport security\|certificate" "$ISSUE_FILE"; then
    echo "✓ Transport security requirements found"
else
    echo "⚠ Transport security requirements not specified"
fi

echo -e "\n=== AUDIT LOGGING CHECK ==="
if grep -q "audit\|logging\|monitoring" "$ISSUE_FILE"; then
    echo "✓ Audit logging requirements found"
else
    echo "⚠ Audit logging requirements not specified"
fi
```