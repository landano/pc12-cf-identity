# /startWork

Start work on a specific issue

## Usage
```
/startWork ISSUE-XXX
```

## Description
Moves an issue from Open to WIP status, assigns it to the current user, and adds a comment indicating work has started. Automatically commits the changes to git.

## Implementation
```bash
# Start work on a specific issue
ISSUE_ID="$1"
if [ -z "$ISSUE_ID" ]; then
    echo "Usage: /startWork ISSUE-XXX"
    exit 1
fi

# Find the issue file
ISSUE_FILE=$(find ../product-owner/ProjectMgmt/open/ -name "*$ISSUE_ID*.md")
if [ -z "$ISSUE_FILE" ]; then
    echo "Issue $ISSUE_ID not found in open directory"
    exit 1
fi

# Move to WIP directory
WIP_FILE="../product-owner/ProjectMgmt/wip/$(basename "$ISSUE_FILE")"
mv "$ISSUE_FILE" "$WIP_FILE"

# Update status and assignee
CURRENT_DATE=$(date +%Y-%m-%d)
USER_NAME=$(git config --global user.name || whoami)
sed -i "s/\*\*Status:\*\* Open/\*\*Status:\*\* WIP/" "$WIP_FILE"
sed -i "s/\*\*Assignee:\*\* Unassigned/\*\*Assignee:\*\* $USER_NAME/" "$WIP_FILE"

# Add comment
echo -e "\n### $CURRENT_DATE - $USER_NAME\nStarted work on this issue. Beginning implementation of acceptance criteria." >> "$WIP_FILE"

# Git commit
git add ../product-owner/ProjectMgmt/
git commit -m "🗓️ ⇨ 🛠️ [$ISSUE_ID] moved to wip: assigned to $USER_NAME, starting implementation"

echo "Started work on $ISSUE_ID"
echo "=== ISSUE DETAILS ==="
cat "$WIP_FILE"
```