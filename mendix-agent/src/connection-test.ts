import { MendixPlatformClient } from "mendixplatformsdk";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Simple connection test to verify Mendix SDK credentials
 */
async function testConnection() {
    const username = process.env.MENDIX_USERNAME;
    const apiKey = process.env.MENDIX_API_KEY;
    const projectId = process.env.MENDIX_PROJECT_ID;
    
    if (!username || !apiKey) {
        console.error("❌ Missing MENDIX_USERNAME or MENDIX_API_KEY in .env file");
        return;
    }
    
    console.log("🔌 Testing Mendix SDK connection...");
    console.log(`Username: ${username}`);
    console.log(`Project ID: ${projectId || 'Not set'}`);
    
    try {
        // Initialize client
        const client = new MendixPlatformClient();
        
        // Test authentication by getting specific app
        if (projectId) {
            console.log("🔑 Testing authentication and project access...");
            const app = await client.getApp(projectId);
            console.log(`✅ Authentication successful!`);
            console.log(`📱 Project found: ${(app as any).name || 'Project ' + projectId}`);
            console.log(`   App ID: ${projectId}`);
        } else {
            console.log("🔑 Testing authentication...");
            // Try to create a working copy to test auth
            console.log("⚠️  No PROJECT_ID provided, cannot test project access");
            console.log("   Please add MENDIX_PROJECT_ID to your .env file");
        }
        
    } catch (error: any) {
        console.error(`❌ Connection failed: ${error.message}`);
        if (error.status === 401) {
            console.error("   → Check your API key and username");
        } else if (error.status === 403) {
            console.error("   → Check your permissions");
        }
    }
}

// Run the test
testConnection().catch(console.error);