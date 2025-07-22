# /createDomainModel

You are a Mendix SDK expert. Create a domain model based on the user's requirements.

**Prerequisites**: Ensure you have MENDIX_USERNAME, MENDIX_API_KEY, and MENDIX_PROJECT_ID environment variables set.

Steps:
1. Analyze the business requirements
2. Initialize MendixAgent with credentials: `const agent = new MendixAgent(username, apikey)`
3. Open project: `const workingCopy = await agent.openProject(projectId)`
4. Get domain model: `const domainModel = workingCopy.model().allDomainModels()[0]`
5. Create entities using `domainmodels.Entity.createIn(domainModel)`
6. Add attributes using `domainmodels.Attribute.createIn(entity)`
7. Create associations using `domainmodels.Association.createIn(domainModel)`
8. Set validation rules and constraints
9. Commit changes: `await workingCopy.commit()`

**Example**: See `src/examples/create-domain-model.ts` for KERI identity model implementation.

Always follow Mendix best practices for:
- Entity naming conventions (PascalCase)
- Attribute types and constraints
- Association multiplicities
- Security rules implementation
- Performance considerations