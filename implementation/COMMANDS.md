# Implementation Team Member Commands

This document provides detailed implementation for all team member commands. Each command includes the logic and workflow for effective sprint execution.

## Sprint Management Commands

### /currentSprint
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

### /sprintStatus
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

## Issue Management Commands

### /startWork ISSUE-XXX
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

### /updateProgress ISSUE-XXX
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

### /completeIssue ISSUE-XXX
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

### /viewIssue ISSUE-XXX
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

## Documentation Access Commands

### /accessDocs
```bash
# Quick access to project documentation
echo "=== PROJECT DOCUMENTATION ==="
echo "1. Project Overview: ../CLAUDE.md"
echo "2. Implementation Guide: ./HowToImplementThisProject.md"
echo "3. Sprint Summary: ../product-owner/ProjectMgmt/SPRINT-1-SUMMARY.md"
echo "4. Epic Specifications: ../product-owner/ProjectMgmt/Milestone 1/"
echo "5. Technical Architecture: ../Milestone1 - Design Specification.md"

echo -e "\n=== QUICK ACCESS ==="
echo "Current sprint goals:"
grep -A 10 "Sprint Goal:" ../product-owner/ProjectMgmt/SPRINT-1-SUMMARY.md

echo -e "\nSecurity requirements:"
grep -A 5 "Security" ../CLAUDE.md
```

### /research
```bash
# Access research materials
echo "=== RESEARCH MATERIALS ==="
echo "Technical research directory: ../shared/research/"
if [ -d "../shared/research/" ]; then
    ls -la ../shared/research/
fi

echo -e "\n=== DESIGN SPECIFICATIONS ==="
echo "Milestone 1 specification: ../Milestone1 - Design Specification.md"
if [ -f "../Milestone1 - Design Specification.md" ]; then
    head -20 "../Milestone1 - Design Specification.md"
fi

echo -e "\n=== PROJECT PROPOSALS ==="
echo "Available: ../proposal.txt, ../milestone1.txt, ../milestone2.txt, ../milestone3.txt"
```

## Quality Assurance Commands

### /checkSecurity ISSUE-XXX
```bash
# Validate security requirements for an issue
ISSUE_ID="$1"
if [ -z "$ISSUE_ID" ]; then
    echo "Usage: /checkSecurity ISSUE-XXX"
    exit 1
fi

ISSUE_FILE=$(find ../product-owner/ProjectMgmt/{open,wip,closed}/ -name "*$ISSUE_ID*.md" 2>/dev/null)
if [ -z "$ISSUE_FILE" ]; then
    echo "Issue $ISSUE_ID not found"
    exit 1
fi

echo "=== SECURITY COMPLIANCE CHECK ==="
echo "Issue: $ISSUE_ID"
echo "File: $ISSUE_FILE"

echo -e "\n=== SECURITY ACCEPTANCE CRITERIA ==="
grep -A 20 "## Acceptance Criteria" "$ISSUE_FILE" | grep -E "(security|private key|TLS|encryption|authentication|authorization|audit)"

echo -e "\n=== KERI EDGE PROTECTION CHECK ==="
if grep -q "edge protection\|private key\|never leave" "$ISSUE_FILE"; then
    echo "✓ KERI edge protection requirements found"
else
    echo "⚠ KERI edge protection requirements not specified"
fi

echo -e "\n=== TRANSPORT SECURITY CHECK ==="
if grep -q "TLS\|transport security\|certificate" "$ISSUE_FILE"; then
    echo "✓ Transport security requirements found"
else
    echo "⚠ Transport security requirements not specified"
fi

echo -e "\n=== AUDIT LOGGING CHECK ==="
if grep -q "audit\|logging\|monitoring" "$ISSUE_FILE"; then
    echo "✓ Audit logging requirements found"
else
    echo "⚠ Audit logging requirements not specified"
fi
```

### /runTests
```bash
# Execute tests for current work
ISSUE_ID="$1"
echo "=== RUNNING TESTS ==="
if [ -n "$ISSUE_ID" ]; then
    echo "Running tests for issue: $ISSUE_ID"
fi

# Check if we're in a project directory with tests
if [ -f "package.json" ]; then
    echo "Node.js project detected"
    npm test
elif [ -f "requirements.txt" ]; then
    echo "Python project detected"
    python -m pytest
else
    echo "No standard test framework detected"
    echo "Manual testing guidelines:"
    echo "1. Verify all acceptance criteria"
    echo "2. Test security implementations"
    echo "3. Validate integration points"
    echo "4. Check error handling"
fi

# Log test results if issue specified
if [ -n "$ISSUE_ID" ]; then
    ISSUE_FILE=$(find ../product-owner/ProjectMgmt/wip/ -name "*$ISSUE_ID*.md" 2>/dev/null)
    if [ -n "$ISSUE_FILE" ]; then
        TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
        USER_NAME=$(git config --global user.name || whoami)
        
        echo -e "\n### $TIMESTAMP - $USER_NAME Testing\n**Action**: Executed test suite\n**Result**: Tests completed - see above output\n**Next**: Address any test failures" >> "$ISSUE_FILE"
        
        git add ../product-owner/ProjectMgmt/
        git commit -m "🔧 [$ISSUE_ID] testing: executed test suite"
    fi
fi
```

## Workflow Integration Commands

### /blocked ISSUE-XXX "reason"
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

### /logWork ISSUE-XXX
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

## Team Coordination Commands

### /myIssues
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

### /dependencies
```bash
# Show dependency information
echo "=== DEPENDENCY ANALYSIS ==="

echo -e "\n=== CURRENT SPRINT DEPENDENCIES ==="
sprint_issues=("001" "015" "017" "021" "022")
for issue in "${sprint_issues[@]}"; do
    issue_file=$(find ../product-owner/ProjectMgmt/{open,wip,closed}/ -name "ISSUE-$issue-*.md" 2>/dev/null)
    if [ -n "$issue_file" ]; then
        echo "ISSUE-$issue:"
        grep -A 10 "## Relationships" "$issue_file" | head -10
        echo ""
    fi
done

echo -e "\n=== CRITICAL PATH ==="
echo "1. ISSUE-001 (Research) - Blocks everything"
echo "2. ISSUE-021 (Edge Protection) - Blocks identity features"
echo "3. ISSUE-022 (Transport Security) - Blocks secure communications"
echo "4. ISSUE-015 (Cardano Plugin) - Blocks NFT features"
echo "5. ISSUE-017 (Wallet Connection) - Blocks wallet features"
```

This commands file provides comprehensive functionality for team members to effectively work with the sprint planning system while maintaining proper project management practices and security standards.