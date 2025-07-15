# /myIssues

Display all issues assigned to you

## Usage
```
/myIssues
```

## Description
Shows all issues assigned to the current user, separated into active (WIP) issues and completed issues.

## Implementation
```bash
# Display all issues assigned to you
USER_NAME=$(git config --global user.name || whoami)
echo "=== YOUR ISSUES ==="
echo "User: $USER_NAME"

echo -e "\n=== ACTIVE (WIP) ISSUES ==="
find ../product-owner/ProjectMgmt/wip/ -name "*.md" -exec grep -l "$USER_NAME" {} \; | while read file; do
    issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
    title=$(head -1 "$file" | sed 's/# //')
    echo "  $issue_id - $title"
done

echo -e "\n=== COMPLETED ISSUES ==="
find ../product-owner/ProjectMgmt/closed/ -name "*.md" -exec grep -l "$USER_NAME" {} \; | while read file; do
    issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
    title=$(head -1 "$file" | sed 's/# //')
    echo "  $issue_id - $title"
done
```