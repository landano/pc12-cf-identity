# /blocked

Report a blocking issue

## Usage
```
/blocked ISSUE-XXX "reason"
```

## Description
Marks an issue as blocked with a specified reason. Adds the blocked label, logs the blocking reason, and suggests alternative sprint-ready issues to work on.

## Implementation
```bash
# Report a blocking issue
ISSUE_ID="$1"
REASON="$2"
if [ -z "$ISSUE_ID" ] || [ -z "$REASON" ]; then
    echo "Usage: /blocked ISSUE-XXX \"reason\""
    exit 1
fi

ISSUE_FILE=$(find ../product-owner/ProjectMgmt/wip/ -name "*$ISSUE_ID*.md" 2>/dev/null)
if [ -z "$ISSUE_FILE" ]; then
    echo "Issue $ISSUE_ID not found in WIP directory"
    exit 1
fi

# Add blocked status to labels
sed -i "s/\*\*Labels:\*\*/\*\*Labels:\*\* blocked,/" "$ISSUE_FILE"

# Add blocking comment
CURRENT_DATE=$(date +%Y-%m-%d)
USER_NAME=$(git config --global user.name || whoami)
echo -e "\n### $CURRENT_DATE - $USER_NAME\n**BLOCKED**: $REASON" >> "$ISSUE_FILE"

# Git commit
git add ../product-owner/ProjectMgmt/
git commit -m "🚫 [$ISSUE_ID] blocked: $REASON"

echo "Issue $ISSUE_ID marked as blocked: $REASON"
echo "Consider working on these alternative issues:"
grep -r "sprint-ready" ../product-owner/ProjectMgmt/open/ | grep -v "$ISSUE_ID" | head -3
```