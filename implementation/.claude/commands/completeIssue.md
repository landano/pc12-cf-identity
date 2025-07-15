# /completeIssue

Complete an issue

## Usage
```
/completeIssue ISSUE-XXX
```

## Description
Moves an issue from WIP to Closed status after verifying acceptance criteria. Warns if criteria are incomplete. Also identifies any issues that are unblocked by this completion.

## Implementation
```bash
# Complete an issue
ISSUE_ID="$1"
if [ -z "$ISSUE_ID" ]; then
    echo "Usage: /completeIssue ISSUE-XXX"
    exit 1
fi

# Find the issue file in WIP
ISSUE_FILE=$(find ../product-owner/ProjectMgmt/wip/ -name "*$ISSUE_ID*.md")
if [ -z "$ISSUE_FILE" ]; then
    echo "Issue $ISSUE_ID not found in WIP directory"
    exit 1
fi

# Check if all acceptance criteria are met
echo "=== ACCEPTANCE CRITERIA CHECK ==="
incomplete_criteria=$(grep -c "\\- \\[ \\]" "$ISSUE_FILE" || echo "0")
if [ "$incomplete_criteria" -gt 0 ]; then
    echo "WARNING: $incomplete_criteria acceptance criteria are not yet complete"
    read -p "Are you sure you want to complete this issue? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
        echo "Issue completion cancelled"
        exit 1
    fi
fi

# Move to closed directory
CLOSED_FILE="../product-owner/ProjectMgmt/closed/$(basename "$ISSUE_FILE")"
mv "$ISSUE_FILE" "$CLOSED_FILE"

# Update status
sed -i "s/\*\*Status:\*\* WIP/\*\*Status:\*\* Closed/" "$CLOSED_FILE"

# Add completion comment
CURRENT_DATE=$(date +%Y-%m-%d)
USER_NAME=$(git config --global user.name || whoami)
echo -e "\n### $CURRENT_DATE - $USER_NAME\nCompleted all acceptance criteria. Issue ready for validation." >> "$CLOSED_FILE"

# Git commit
git add ../product-owner/ProjectMgmt/
git commit -m "🛠️ ⇨ ✅ [$ISSUE_ID] completed: all acceptance criteria met by $USER_NAME"

echo "Issue $ISSUE_ID completed successfully"

# Show unblocked issues
echo -e "\n=== UNBLOCKED ISSUES ==="
grep -r "blocked by.*$ISSUE_ID" ../product-owner/ProjectMgmt/{open,wip}/ 2>/dev/null | cut -d: -f1 | while read file; do
    issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
    echo "  $issue_id - Now unblocked"
done
```