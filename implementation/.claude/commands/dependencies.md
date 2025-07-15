# /dependencies

Show dependency information

## Usage
```
/dependencies
```

## Description
Displays dependency analysis for current sprint issues and shows the critical path for Sprint 1 implementation.

## Implementation
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