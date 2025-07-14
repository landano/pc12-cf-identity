# Workflow Integration Guide

This document outlines the integration between implementation workflows and the project management system to ensure seamless coordination and tracking.

## Integration Architecture

### File System Integration
```
pc12-cf-identity/
├── product-owner/
│   └── ProjectMgmt/          # Project management files
│       ├── open/             # Available issues
│       ├── wip/              # Active issues
│       └── closed/           # Completed issues
├── implementation/           # Implementation team workspace
│   ├── HowToImplementThisProject.md
│   ├── COMMANDS.md
│   ├── QUICK-REFERENCE.md
│   └── WORKFLOW-INTEGRATION.md
└── shared/
    └── research/             # Shared research materials
```

### Git Workflow Integration
```bash
# Implementation workflow follows these patterns:

# Issue State Changes (affects ProjectMgmt only)
git add ../product-owner/ProjectMgmt/
git commit -m "🗓️ ⇨ 🛠️ [ISSUE-XXX] moved to wip: starting implementation"

# Implementation Work (affects codebase)
git add .
git commit -m "feat: implement KERI edge protection for user devices"

# Implementation Logging (affects ProjectMgmt only)
git add ../product-owner/ProjectMgmt/
git commit -m "🔧 [ISSUE-XXX] implementation: added HSM integration"
```

## Automated Workflow Commands

### /autoStart
```bash
# Automatically start work on highest priority available issue
#!/bin/bash
echo "=== AUTO-START WORKFLOW ==="

# Find highest priority sprint-ready issue
highest_priority_issue=$(find ../product-owner/ProjectMgmt/open/ -name "*.md" -exec grep -l "sprint-ready" {} \; | \
    while read file; do
        priority=$(grep "Sprint Priority:" "$file" | cut -d: -f2 | tr -d ' ')
        issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
        echo "$priority:$issue_id:$file"
    done | sort -n | head -1)

if [ -n "$highest_priority_issue" ]; then
    issue_id=$(echo "$highest_priority_issue" | cut -d: -f2)
    echo "Starting work on highest priority issue: $issue_id"
    /startWork "$issue_id"
else
    echo "No sprint-ready issues available"
fi
```

### /autoUpdate
```bash
# Automatically update all your WIP issues with standard progress check
#!/bin/bash
echo "=== AUTO-UPDATE WORKFLOW ==="

USER_NAME=$(git config --global user.name || whoami)
find ../product-owner/ProjectMgmt/wip/ -name "*.md" -exec grep -l "$USER_NAME" {} \; | while read file; do
    issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
    echo "Updating progress for $issue_id"
    
    # Check if updated in last 24 hours
    last_update=$(grep "### $(date +%Y-%m-%d)" "$file" | tail -1)
    if [ -z "$last_update" ]; then
        echo "  No update today - prompting for progress"
        /updateProgress "$issue_id"
    else
        echo "  Already updated today"
    fi
done
```

### /autoComplete
```bash
# Check for issues ready for completion
#!/bin/bash
echo "=== AUTO-COMPLETE WORKFLOW ==="

USER_NAME=$(git config --global user.name || whoami)
find ../product-owner/ProjectMgmt/wip/ -name "*.md" -exec grep -l "$USER_NAME" {} \; | while read file; do
    issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
    
    # Check if all acceptance criteria are met
    incomplete_criteria=$(grep -c "\\- \\[ \\]" "$file" || echo "0")
    if [ "$incomplete_criteria" -eq 0 ]; then
        echo "$issue_id: Ready for completion (all criteria met)"
        read -p "Complete $issue_id? (y/N): " confirm
        if [ "$confirm" = "y" ]; then
            /completeIssue "$issue_id"
        fi
    else
        echo "$issue_id: $incomplete_criteria criteria remaining"
    fi
done
```

## Integration Monitoring

### /monitorSprint
```bash
# Monitor sprint progress and team coordination
#!/bin/bash
echo "=== SPRINT MONITORING ==="

# Sprint progress calculation
sprint_issues=("001" "015" "017" "021" "022")
total_issues=${#sprint_issues[@]}
completed_issues=0

for issue in "${sprint_issues[@]}"; do
    if [ -f "../product-owner/ProjectMgmt/closed/ISSUE-$issue-"*.md ]; then
        completed_issues=$((completed_issues + 1))
    fi
done

progress=$((completed_issues * 100 / total_issues))
echo "Sprint Progress: $completed_issues/$total_issues ($progress%)"

# Team workload analysis
echo -e "\n=== TEAM WORKLOAD ==="
find ../product-owner/ProjectMgmt/wip/ -name "*.md" | while read file; do
    assignee=$(grep "Assignee:" "$file" | cut -d: -f2 | xargs)
    issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
    if [ "$assignee" != "Unassigned" ]; then
        echo "$assignee: $issue_id"
    fi
done

# Blocked issues alert
echo -e "\n=== BLOCKED ISSUES ==="
find ../product-owner/ProjectMgmt/wip/ -name "*.md" -exec grep -l "blocked" {} \; | while read file; do
    issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
    reason=$(grep -A 1 "BLOCKED" "$file" | tail -1)
    echo "⚠️  $issue_id: $reason"
done
```

### /generateReport
```bash
# Generate comprehensive team report
#!/bin/bash
echo "=== IMPLEMENTATION TEAM REPORT ==="
echo "Generated: $(date)"

# Sprint overview
echo -e "\n=== SPRINT OVERVIEW ==="
cat ../product-owner/ProjectMgmt/SPRINT-1-SUMMARY.md | head -20

# Issue status summary
echo -e "\n=== ISSUE STATUS SUMMARY ==="
echo "Open: $(ls ../product-owner/ProjectMgmt/open/*.md 2>/dev/null | wc -l)"
echo "WIP: $(ls ../product-owner/ProjectMgmt/wip/*.md 2>/dev/null | wc -l)"
echo "Closed: $(ls ../product-owner/ProjectMgmt/closed/*.md 2>/dev/null | wc -l)"

# Recent activity
echo -e "\n=== RECENT ACTIVITY ==="
git log --oneline --grep="\\[ISSUE-" --since="1 week ago" | head -10

# Implementation velocity
echo -e "\n=== IMPLEMENTATION VELOCITY ==="
implementations_this_week=$(git log --since="1 week ago" --grep="🔧" --oneline | wc -l)
echo "Implementation entries this week: $implementations_this_week"

# Next sprint preparation
echo -e "\n=== NEXT SPRINT PREPARATION ==="
echo "Issues unblocked by current sprint completion:"
for issue in "002" "003" "004" "013" "014" "018" "019"; do
    if [ -f "../product-owner/ProjectMgmt/open/ISSUE-$issue-"*.md ]; then
        title=$(head -1 "../product-owner/ProjectMgmt/open/ISSUE-$issue-"*.md | sed 's/# //')
        echo "  ISSUE-$issue: $title"
    fi
done
```

## Quality Integration

### /validateWork
```bash
# Comprehensive work validation
#!/bin/bash
ISSUE_ID="$1"
if [ -z "$ISSUE_ID" ]; then
    echo "Usage: /validateWork ISSUE-XXX"
    exit 1
fi

echo "=== WORK VALIDATION ==="
echo "Issue: $ISSUE_ID"

# Find the issue file
ISSUE_FILE=$(find ../product-owner/ProjectMgmt/wip/ -name "*$ISSUE_ID*.md" 2>/dev/null)
if [ -z "$ISSUE_FILE" ]; then
    echo "Issue not found in WIP"
    exit 1
fi

# Check acceptance criteria
echo -e "\n=== ACCEPTANCE CRITERIA CHECK ==="
total_criteria=$(grep -c "\\- \\[" "$ISSUE_FILE" || echo "0")
completed_criteria=$(grep -c "\\- \\[✓\\]" "$ISSUE_FILE" || echo "0")
echo "Progress: $completed_criteria/$total_criteria criteria completed"

# Security validation
echo -e "\n=== SECURITY VALIDATION ==="
/checkSecurity "$ISSUE_ID"

# Implementation log validation
echo -e "\n=== IMPLEMENTATION LOG VALIDATION ==="
log_entries=$(grep -c "### .* - LLM Implementation" "$ISSUE_FILE" || echo "0")
echo "Implementation log entries: $log_entries"

if [ "$log_entries" -eq 0 ]; then
    echo "⚠️  No implementation work logged"
else
    echo "✓ Implementation work documented"
fi

# Test validation
echo -e "\n=== TEST VALIDATION ==="
/runTests "$ISSUE_ID"
```

### /securityScan
```bash
# Security-focused validation across all active issues
#!/bin/bash
echo "=== SECURITY SCAN ==="

# Check all WIP issues for security compliance
find ../product-owner/ProjectMgmt/wip/ -name "*.md" | while read file; do
    issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
    
    # Check for security labels
    if grep -q "security\|keri\|edge-protection" "$file"; then
        echo "🔒 $issue_id: Security-critical issue"
        
        # Check for edge protection compliance
        if grep -q "private key.*never leave" "$file"; then
            echo "  ✓ Edge protection requirement documented"
        else
            echo "  ⚠️  Edge protection requirement missing"
        fi
        
        # Check for security logging
        if grep -q "audit\|logging" "$file"; then
            echo "  ✓ Security logging requirement documented"
        else
            echo "  ⚠️  Security logging requirement missing"
        fi
    fi
done

# Check for security-related git commits
echo -e "\n=== RECENT SECURITY COMMITS ==="
git log --oneline --grep="security\|keri\|edge" --since="1 week ago"
```

## Continuous Integration Hooks

### Pre-commit Hook
```bash
# .git/hooks/pre-commit
#!/bin/bash
echo "Running pre-commit validation..."

# Check if this is a ProjectMgmt update
if git diff --cached --name-only | grep -q "ProjectMgmt/"; then
    echo "ProjectMgmt update detected - validating issue format"
    
    # Validate issue file format
    for file in $(git diff --cached --name-only | grep "ProjectMgmt/.*\.md$"); do
        if [ -f "$file" ]; then
            # Check for required fields
            if ! grep -q "\\*\\*Status:\\*\\*" "$file"; then
                echo "Error: Missing Status field in $file"
                exit 1
            fi
            
            if ! grep -q "\\*\\*Priority:\\*\\*" "$file"; then
                echo "Error: Missing Priority field in $file"
                exit 1
            fi
        fi
    done
    
    echo "✓ Issue format validation passed"
fi

# Check for security keywords in code changes
if git diff --cached | grep -i "private.*key\|secret\|password" > /dev/null; then
    echo "⚠️  Security-sensitive content detected - please review"
    read -p "Continue with commit? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
        exit 1
    fi
fi

echo "Pre-commit validation completed"
```

### Post-commit Hook
```bash
# .git/hooks/post-commit
#!/bin/bash
# Auto-update sprint status after commits

# Check if this was an issue completion
if git log -1 --pretty=format:"%s" | grep -q "⇨ ✅"; then
    echo "Issue completion detected - checking sprint progress"
    
    # Count completed sprint issues
    sprint_issues=("001" "015" "017" "021" "022")
    completed=0
    
    for issue in "${sprint_issues[@]}"; do
        if [ -f "../product-owner/ProjectMgmt/closed/ISSUE-$issue-"*.md ]; then
            completed=$((completed + 1))
        fi
    done
    
    echo "Sprint 1 progress: $completed/5 issues completed"
    
    if [ "$completed" -eq 5 ]; then
        echo "🎉 Sprint 1 completed! All issues closed."
        # Notify team about sprint completion
    fi
fi
```

## Team Coordination Integration

### /dailyStandup
```bash
# Generate daily standup report
#!/bin/bash
echo "=== DAILY STANDUP REPORT ==="
echo "Date: $(date +%Y-%m-%d)"

USER_NAME=$(git config --global user.name || whoami)
echo "Team Member: $USER_NAME"

# Yesterday's work
echo -e "\n=== YESTERDAY'S WORK ==="
git log --oneline --author="$USER_NAME" --since="1 day ago" | head -5

# Today's plan
echo -e "\n=== TODAY'S PLAN ==="
find ../product-owner/ProjectMgmt/wip/ -name "*.md" -exec grep -l "$USER_NAME" {} \; | while read file; do
    issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
    title=$(head -1 "$file" | sed 's/# //')
    echo "  Continue: $issue_id - $title"
done

# Blockers
echo -e "\n=== BLOCKERS ==="
find ../product-owner/ProjectMgmt/wip/ -name "*.md" -exec grep -l "blocked" {} \; | while read file; do
    if grep -q "$USER_NAME" "$file"; then
        issue_id=$(basename "$file" | grep -oE "ISSUE-[0-9]+-[^.]+")
        reason=$(grep -A 1 "BLOCKED" "$file" | tail -1)
        echo "  $issue_id: $reason"
    fi
done
```

This workflow integration ensures seamless coordination between implementation work and project management, maintaining transparency and enabling effective team collaboration while preserving security and quality standards.