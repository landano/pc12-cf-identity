# /viewIssue

View detailed issue information

## Usage
```
/viewIssue ISSUE-XXX
```

## Description
Displays complete details of an issue regardless of its status (Open, WIP, or Closed). Also shows dependency analysis identifying other issues that reference this one.

## Implementation
```bash
# View detailed issue information
ISSUE_ID="$1"
if [ -z "$ISSUE_ID" ]; then
    echo "Usage: /viewIssue ISSUE-XXX"
    exit 1
fi

# Find the issue file in any directory
ISSUE_FILE=$(find ../product-owner/ProjectMgmt/{open,wip,closed}/ -name "*$ISSUE_ID*.md" 2>/dev/null)
if [ -z "$ISSUE_FILE" ]; then
    echo "Issue $ISSUE_ID not found"
    exit 1
fi

echo "=== ISSUE DETAILS ==="
cat "$ISSUE_FILE"

echo -e "\n=== DEPENDENCY ANALYSIS ==="
grep -r "$ISSUE_ID" ../product-owner/ProjectMgmt/{open,wip,closed}/ 2>/dev/null | grep -v "$(basename "$ISSUE_FILE")" | while read line; do
    file=$(echo $line | cut -d: -f1)
    content=$(echo $line | cut -d: -f2-)
    issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
    echo "  $issue_id: $content"
done
```