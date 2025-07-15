# /updateProgress

Update progress on an issue

## Usage
```
/updateProgress ISSUE-XXX
```

## Description
Updates the progress on a WIP issue by adding implementation details including work completed, files modified, commands run, results, and next steps. Interactive prompts guide the update process.

## Implementation
```bash
# Update progress on an issue
ISSUE_ID="$1"
if [ -z "$ISSUE_ID" ]; then
    echo "Usage: /updateProgress ISSUE-XXX"
    exit 1
fi

# Find the issue file in WIP
ISSUE_FILE=$(find ../product-owner/ProjectMgmt/wip/ -name "*$ISSUE_ID*.md")
if [ -z "$ISSUE_FILE" ]; then
    echo "Issue $ISSUE_ID not found in WIP directory"
    exit 1
fi

# Show current status
echo "=== CURRENT PROGRESS ==="
grep -A 20 "## Tasks" "$ISSUE_FILE" | head -20

# Prompt for updates
echo -e "\n=== UPDATE PROGRESS ==="
read -p "Describe work completed: " work_description
read -p "Files modified (comma-separated): " files_modified
read -p "Commands run: " commands_run
read -p "Result (Success/Partial/Failed): " result
read -p "Next steps: " next_steps

# Add implementation log entry
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
USER_NAME=$(git config --global user.name || whoami)

cat >> "$ISSUE_FILE" << EOF

### $TIMESTAMP - $USER_NAME Implementation
**Action**: $work_description
**Files Modified**: 
$(echo "$files_modified" | sed 's/,/\n- /g' | sed 's/^/- /')
**Commands Run**: $commands_run
**Result**: $result
**Next Steps**: $next_steps
EOF

# Git commit
git add ../product-owner/ProjectMgmt/
git commit -m "🔧 [$ISSUE_ID] implementation: $work_description"

echo "Progress updated for $ISSUE_ID"
```