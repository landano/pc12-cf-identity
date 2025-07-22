import { MendixAgent } from "../index";
import { domainmodels } from "mendixmodelsdk";

/**
 * Example: Create a complete domain model for identity management
 */
export async function createIdentityDomainModel() {
    // Initialize SDK client
    const agent = new MendixAgent(
        process.env.MENDIX_USERNAME || "",
        process.env.MENDIX_API_KEY || ""
    );
    
    // Create or open project
    const projectId = process.env.MENDIX_PROJECT_ID || "";
    const workingCopy = await agent.openProject(projectId);
    
    // Get domain model
    const domainModel = workingCopy.model().allDomainModels()[0];
    
    // Create Chief entity
    const chiefEntity = domainmodels.Entity.createIn(domainModel);
    chiefEntity.name = "Chief";
    chiefEntity.location = { x: 100, y: 100 };
    
    // Add attributes to Chief
    const aidAttribute = domainmodels.Attribute.createIn(chiefEntity);
    aidAttribute.name = "AID";
    aidAttribute.type = domainmodels.StringAttributeType.create();
    
    const nameAttribute = domainmodels.Attribute.createIn(chiefEntity);
    nameAttribute.name = "Name";
    nameAttribute.type = domainmodels.StringAttributeType.create();
    
    // Create Representative entity
    const repEntity = domainmodels.Entity.createIn(domainModel);
    repEntity.name = "Representative";
    repEntity.location = { x: 300, y: 100 };
    
    // Add attributes to Representative
    const repAidAttribute = domainmodels.Attribute.createIn(repEntity);
    repAidAttribute.name = "AID";
    repAidAttribute.type = domainmodels.StringAttributeType.create();
    
    const credentialAttribute = domainmodels.Attribute.createIn(repEntity);
    credentialAttribute.name = "Credential";
    credentialAttribute.type = domainmodels.StringAttributeType.create();
    
    // Create association between Chief and Representative
    const association = domainmodels.Association.createIn(domainModel);
    association.parent = chiefEntity;
    association.child = repEntity;
    association.name = "Chief_Representative";
    
    // Create NFT entity
    const nftEntity = domainmodels.Entity.createIn(domainModel);
    nftEntity.name = "LandanoNFT";
    nftEntity.location = { x: 500, y: 100 };
    
    // Add NFT attributes
    const policyIdAttribute = domainmodels.Attribute.createIn(nftEntity);
    policyIdAttribute.name = "PolicyId";
    policyIdAttribute.type = domainmodels.StringAttributeType.create();
    
    const metadataAttribute = domainmodels.Attribute.createIn(nftEntity);
    metadataAttribute.name = "Metadata";
    metadataAttribute.type = domainmodels.StringAttributeType.create();
    
    // Associate NFT with Representative
    const nftAssociation = domainmodels.Association.createIn(domainModel);
    nftAssociation.parent = repEntity;
    nftAssociation.child = nftEntity;
    nftAssociation.name = "Representative_NFT";
    
    // Commit changes
    await workingCopy.commit();
    console.log("Identity domain model created successfully!");
}

// Run if called directly
if (require.main === module) {
    createIdentityDomainModel().catch(console.error);
}