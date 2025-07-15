# /runTests

Execute tests for current work

## Usage
```
/runTests [ISSUE-XXX]
```

## Description
Runs tests for the current project. Detects test framework based on project type (Node.js, Python) or provides manual testing guidelines. If an issue ID is provided, logs test execution in the issue.

## Implementation
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