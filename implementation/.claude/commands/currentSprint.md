# /currentSprint

Display current sprint information

## Usage
```
/currentSprint
```

## Description
Shows the current sprint summary, sprint-ready issues, and your currently assigned issues.

## Implementation
```bash
# Display current sprint information
echo "=== CURRENT SPRINT ==="
cat ../product-owner/ProjectMgmt/SPRINT-1-SUMMARY.md

echo -e "\n=== SPRINT-READY ISSUES ==="
grep -r "sprint-ready" ../product-owner/ProjectMgmt/open/ | grep -E "ISSUE-[0-9]+" | while read line; do
    issue_file=$(echo $line | cut -d: -f1)
    issue_id=$(basename "$issue_file" | grep -oE "ISSUE-[0-9]+-[^.]+")
    priority=$(grep "Sprint Priority:" "$issue_file" | cut -d: -f2 | xargs)
    title=$(head -1 "$issue_file" | sed 's/# //')
    echo "  $priority - $title"
done

echo -e "\n=== YOUR CURRENT ISSUES ==="
find ../product-owner/ProjectMgmt/wip/ -name "*.md" -exec grep -l "$(git config --global user.name)" {} \;
```