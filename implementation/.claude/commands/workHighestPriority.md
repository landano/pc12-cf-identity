# /workHighestPriority

Automatically start work on the highest priority sprint-ready issue

## Usage
```
/workHighestPriority
```

## Description
Finds the highest priority sprint-ready issue in the current sprint and automatically starts work on it. Issues are prioritized as P1 > P2 > P3. If multiple issues have the same priority, it selects the first one found.

## Implementation
```bash
# Find and start work on highest priority sprint-ready issue
echo "=== FINDING HIGHEST PRIORITY SPRINT-READY ISSUE ==="

# Find all sprint-ready issues and their priorities
declare -A priority_issues
priority_issues[P1]=""
priority_issues[P2]=""
priority_issues[P3]=""

# Search for sprint-ready issues
grep -r "sprint-ready" ../product-owner/ProjectMgmt/open/ | grep -E "ISSUE-[0-9]+" | while IFS=: read file_path rest; do
    if [ -f "$file_path" ]; then
        issue_id=$(basename "$file_path" | grep -oE "ISSUE-[0-9]+-[^.]+")
        priority=$(grep "Sprint Priority:" "$file_path" | cut -d: -f2 | xargs)
        title=$(head -1 "$file_path" | sed 's/# //')
        
        echo "Found: $priority - $issue_id: $title"
        
        # Store the first issue found for each priority level
        case "$priority" in
            "P1")
                if [ -z "${priority_issues[P1]}" ]; then
                    priority_issues[P1]="$issue_id"
                fi
                ;;
            "P2")
                if [ -z "${priority_issues[P2]}" ]; then
                    priority_issues[P2]="$issue_id"
                fi
                ;;
            "P3")
                if [ -z "${priority_issues[P3]}" ]; then
                    priority_issues[P3]="$issue_id"
                fi
                ;;
        esac
    fi
done > /tmp/sprint_issues.txt

# Extract issues from temp file since while loop runs in subshell
P1_ISSUE=$(grep "Found: P1" /tmp/sprint_issues.txt | head -1 | grep -oE "ISSUE-[0-9]+-[^:]+" | head -1)
P2_ISSUE=$(grep "Found: P2" /tmp/sprint_issues.txt | head -1 | grep -oE "ISSUE-[0-9]+-[^:]+" | head -1)
P3_ISSUE=$(grep "Found: P3" /tmp/sprint_issues.txt | head -1 | grep -oE "ISSUE-[0-9]+-[^:]+" | head -1)

echo -e "\nAvailable sprint-ready issues by priority:"
cat /tmp/sprint_issues.txt
rm -f /tmp/sprint_issues.txt

# Select highest priority issue
SELECTED_ISSUE=""
if [ ! -z "$P1_ISSUE" ]; then
    SELECTED_ISSUE="$P1_ISSUE"
    echo -e "\n🔥 Starting work on P1 issue: $SELECTED_ISSUE"
elif [ ! -z "$P2_ISSUE" ]; then
    SELECTED_ISSUE="$P2_ISSUE"
    echo -e "\n⚡ Starting work on P2 issue: $SELECTED_ISSUE"
elif [ ! -z "$P3_ISSUE" ]; then
    SELECTED_ISSUE="$P3_ISSUE"
    echo -e "\n📋 Starting work on P3 issue: $SELECTED_ISSUE"
else
    echo -e "\n❌ No sprint-ready issues found!"
    echo "Use /currentSprint to see available issues or contact the Product Owner."
    exit 1
fi

# Extract just the issue number (e.g., "001" from "ISSUE-001-description")
ISSUE_NUMBER=$(echo "$SELECTED_ISSUE" | grep -oE "[0-9]+")

echo -e "\n=== STARTING WORK ON $SELECTED_ISSUE ==="

# Find the issue file
ISSUE_FILE=$(find ../product-owner/ProjectMgmt/open/ -name "*ISSUE-$ISSUE_NUMBER-*.md")
if [ -z "$ISSUE_FILE" ]; then
    echo "❌ Issue file for $SELECTED_ISSUE not found in open directory"
    exit 1
fi

# Move to WIP directory
WIP_FILE="../product-owner/ProjectMgmt/wip/$(basename "$ISSUE_FILE")"
mv "$ISSUE_FILE" "$WIP_FILE"

# Update status and assignee
CURRENT_DATE=$(date +%Y-%m-%d)
USER_NAME=$(git config --global user.name || whoami)
sed -i.bak "s/\*\*Status:\*\* Open/\*\*Status:\*\* WIP/" "$WIP_FILE"
sed -i.bak "s/\*\*Assignee:\*\* Unassigned/\*\*Assignee:\*\* $USER_NAME/" "$WIP_FILE"
rm -f "$WIP_FILE.bak"

# Add comment
echo -e "\n### $CURRENT_DATE - $USER_NAME\nStarted work on this issue (automatically selected as highest priority). Beginning implementation of acceptance criteria." >> "$WIP_FILE"

# Git commit
git add ../product-owner/ProjectMgmt/
git commit -m "🗓️ ⇨ 🛠️ [ISSUE-$ISSUE_NUMBER] moved to wip: assigned to $USER_NAME, starting highest priority sprint work"

echo -e "\n✅ Successfully started work on ISSUE-$ISSUE_NUMBER"
echo "=== ISSUE DETAILS ==="
cat "$WIP_FILE"
```