import { MendixAgent } from "../index";

/**
 * Simple example: Connect to Mendix and create basic structure
 */
export async function simpleExample() {
    // Initialize SDK client
    const agent = new MendixAgent(
        process.env.MENDIX_USERNAME || "",
        process.env.MENDIX_API_KEY || ""
    );
    
    // Get project ID from environment
    const projectId = process.env.MENDIX_PROJECT_ID || "";
    
    if (!projectId) {
        console.error("Please set MENDIX_PROJECT_ID environment variable");
        return;
    }
    
    try {
        console.log("Opening project...");
        const workingCopy = await agent.openProject(projectId);
        
        console.log("Creating entity...");
        await agent.createEntity(workingCopy, "MyFirstModule", "TestEntity");
        
        console.log("Creating microflow...");
        await agent.createMicroflow(workingCopy, "MyFirstModule", "TestMicroflow");
        
        console.log("Creating page...");
        await agent.createPage(workingCopy, "MyFirstModule", "TestPage");
        
        console.log("✅ All operations completed successfully!");
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// Run if called directly
if (require.main === module) {
    simpleExample().catch(console.error);
}