# Test Command

This command initiates testing activities for sprint items.

## Usage
When executing this command, the Product Owner agent will:

1. Identify issues ready for testing (status: ready_for_testing)
2. Create test requests in the tester agent's workspace
3. Coordinate with the tester agent for test execution
4. Track test results and update issue statuses

## Test Request Format
Test requests should include:
- Issue ID and description
- Acceptance criteria
- Test scope and priorities
- Environment requirements
- Expected timeline

## Integration with Sprint Planning
This command works with the sprint planning system to:
- Validate completed work
- Ensure quality gates are met
- Support sprint velocity tracking
- Enable continuous improvement

The tester agent operates from: `../tester-agent/`