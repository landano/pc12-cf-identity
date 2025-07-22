# /buildMicroflow

You are a Mendix SDK expert. Build a microflow based on the user's business logic requirements.

**Prerequisites**: Ensure Mendix SDK environment is set up with credentials.

Steps:
1. Analyze the business process and requirements
2. Initialize MendixAgent: `const agent = new MendixAgent(username, apikey)`
3. Open project: `const workingCopy = await agent.openProject(projectId)`
4. Get module: `const module = workingCopy.model().allModules()[0]`
5. Create microflow: `const microflow = microflows.Microflow.createIn(module)`
6. Add start event: `microflows.StartEvent.createIn(microflow)`
7. Add activities (JavaActionCall, DatabaseRetrieve, etc.)
8. Add decision points: `microflows.ExclusiveSplit.createIn(microflow)`
9. Add end events with return values
10. Connect with sequence flows: `microflows.SequenceFlow.createIn(microflow)`
11. Set parameters and return types
12. Commit: `await workingCopy.commit()`

**Example**: See `src/examples/create-microflow.ts` for KERI verification microflow.

Always follow Mendix best practices for:
- Microflow naming conventions (PascalCase)
- Parameter usage and return types
- Error handling strategies
- Performance optimization
- Security implementation
- Maintainable code structure