# /sprintStatus

Show comprehensive sprint status

## Usage
```
/sprintStatus
```

## Description
Displays an overview of sprint status including issue counts by status (Open, WIP, Closed) and specific progress on Sprint 1 issues.

## Implementation
```bash
# Show comprehensive sprint status
echo "=== SPRINT STATUS OVERVIEW ==="
echo "Open Issues: $(ls ../product-owner/ProjectMgmt/open/*.md 2>/dev/null | wc -l)"
echo "WIP Issues: $(ls ../product-owner/ProjectMgmt/wip/*.md 2>/dev/null | wc -l)"
echo "Closed Issues: $(ls ../product-owner/ProjectMgmt/closed/*.md 2>/dev/null | wc -l)"

echo -e "\n=== SPRINT 1 PROGRESS ==="
sprint_issues=("001" "015" "017" "021" "022")
for issue in "${sprint_issues[@]}"; do
    if [ -f "../product-owner/ProjectMgmt/open/ISSUE-$issue-"*.md ]; then
        status="Open"
    elif [ -f "../product-owner/ProjectMgmt/wip/ISSUE-$issue-"*.md ]; then
        status="WIP"
    elif [ -f "../product-owner/ProjectMgmt/closed/ISSUE-$issue-"*.md ]; then
        status="Closed"
    else
        status="Unknown"
    fi
    echo "  ISSUE-$issue: $status"
done
```