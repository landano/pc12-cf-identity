import { MendixAgent } from "../index";
import { microflows, expressions } from "mendixmodelsdk";

/**
 * Example: Create microflow for KERI identity verification
 */
export async function createVerificationMicroflow() {
    const agent = new MendixAgent(
        process.env.MENDIX_USERNAME || "",
        process.env.MENDIX_API_KEY || ""
    );
    
    const projectId = process.env.MENDIX_PROJECT_ID || "";
    const workingCopy = await agent.openProject(projectId);
    
    // Get module
    const module = workingCopy.model().allModules()[0];
    
    // Create microflow
    const microflow = microflows.Microflow.createIn(module);
    microflow.name = "VerifyKERIIdentity";
    
    // Create start event
    const startEvent = microflows.StartEvent.createIn(microflow);
    startEvent.relativeMiddlePoint = { x: 100, y: 100 };
    
    // Create parameter for AID
    const aidParam = microflows.MicroflowParameter.createIn(microflow);
    aidParam.name = "AID";
    aidParam.type = microflows.StringType.create();
    
    // Create Java action call for KERI verification
    const javaAction = microflows.JavaActionCall.createIn(microflow);
    javaAction.relativeMiddlePoint = { x: 300, y: 100 };
    javaAction.actionQualifiedName = "MyFirstModule.VerifyKERICredential";
    
    // Create decision for verification result
    const decision = microflows.ExclusiveSplit.createIn(microflow);
    decision.relativeMiddlePoint = { x: 500, y: 100 };
    decision.caption = "Valid?";
    
    // Create end events
    const successEnd = microflows.EndEvent.createIn(microflow);
    successEnd.relativeMiddlePoint = { x: 700, y: 50 };
    successEnd.returnValue = expressions.Expression.createLiteral("true");
    
    const failureEnd = microflows.EndEvent.createIn(microflow);
    failureEnd.relativeMiddlePoint = { x: 700, y: 150 };
    failureEnd.returnValue = expressions.Expression.createLiteral("false");
    
    // Create flows
    const flow1 = microflows.SequenceFlow.createIn(microflow);
    flow1.origin = startEvent;
    flow1.destination = javaAction;
    
    const flow2 = microflows.SequenceFlow.createIn(microflow);
    flow2.origin = javaAction;
    flow2.destination = decision;
    
    const successFlow = microflows.SequenceFlow.createIn(microflow);
    successFlow.origin = decision;
    successFlow.destination = successEnd;
    successFlow.caseValue = expressions.Expression.createLiteral("true");
    
    const failureFlow = microflows.SequenceFlow.createIn(microflow);
    failureFlow.origin = decision;
    failureFlow.destination = failureEnd;
    failureFlow.caseValue = expressions.Expression.createLiteral("false");
    
    // Set return type
    microflow.microflowReturnType = microflows.BooleanType.create();
    
    await workingCopy.commit();
    console.log("KERI verification microflow created successfully!");
}

if (require.main === module) {
    createVerificationMicroflow().catch(console.error);
}