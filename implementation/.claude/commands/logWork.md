# /logWork

Log implementation work in an issue

## Usage
```
/logWork ISSUE-XXX
```

## Description
Logs detailed implementation work for a WIP issue through interactive prompts. Records action, files modified, commands run, results, issues found, and next steps.

## Implementation
```bash
# Log implementation work in an issue
ISSUE_ID="$1"
if [ -z "$ISSUE_ID" ]; then
    echo "Usage: /logWork ISSUE-XXX"
    exit 1
fi

ISSUE_FILE=$(find ../product-owner/ProjectMgmt/wip/ -name "*$ISSUE_ID*.md" 2>/dev/null)
if [ -z "$ISSUE_FILE" ]; then
    echo "Issue $ISSUE_ID not found in WIP directory"
    exit 1
fi

# Prompt for work details
echo "=== LOG IMPLEMENTATION WORK ==="
read -p "Action description: " action
read -p "Files modified (comma-separated): " files
read -p "Commands run: " commands
read -p "Result: " result
read -p "Issues found (if any): " issues
read -p "Next steps: " next_steps

# Add implementation log entry
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
USER_NAME=$(git config --global user.name || whoami)

cat >> "$ISSUE_FILE" << EOF

### $TIMESTAMP - $USER_NAME Implementation
**Action**: $action
**Files Modified**: 
$(echo "$files" | sed 's/,/\n- /g' | sed 's/^/- /')
**Commands Run**: $commands
**Result**: $result
$([ -n "$issues" ] && echo "**Issues Found**: $issues")
**Next Steps**: $next_steps
EOF

# Git commit
git add ../product-owner/ProjectMgmt/
git commit -m "🔧 [$ISSUE_ID] implementation: $action"

echo "Implementation work logged for $ISSUE_ID"
```