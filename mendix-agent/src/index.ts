import { MendixPlatformClient, OnlineWorkingCopy, Project } from "mendixplatformsdk";
import { domainmodels, microflows, pages } from "mendixmodelsdk";

/**
 * Mendix SDK Client wrapper for common operations
 */
export class MendixAgent {
    private client: MendixPlatformClient;
    
    constructor(username: string, apikey: string) {
        this.client = new MendixPlatformClient(username, apikey);
    }
    
    /**
     * Create a new Mendix project
     */
    async createProject(projectName: string, templateId?: string): Promise<Project> {
        return await this.client.createNewApp(projectName, {
            templateId: templateId || "blank"
        });
    }
    
    /**
     * Open existing project for editing
     */
    async openProject(projectId: string): Promise<OnlineWorkingCopy> {
        const project = this.client.getProject(projectId);
        return await project.createWorkingCopy();
    }
    
    /**
     * Create domain model entities
     */
    async createEntity(workingCopy: OnlineWorkingCopy, moduleName: string, entityName: string): Promise<void> {
        const model = workingCopy.model();
        const domainModel = model.allDomainModels()
            .find((dm: any) => dm.containerAsModule.name === moduleName);
            
        if (!domainModel) {
            throw new Error(`Module ${moduleName} not found`);
        }
        
        const entity = domainmodels.Entity.createIn(domainModel);
        entity.name = entityName;
        entity.location = { x: 100, y: 100 };
        
        await model.flushChanges();
        await workingCopy.commitToRepository("main");
    }
    
    /**
     * Create microflow
     */
    async createMicroflow(workingCopy: OnlineWorkingCopy, moduleName: string, microflowName: string): Promise<void> {
        const model = workingCopy.model();
        const module = model.allModules()
            .find((m: any) => m.name === moduleName);
            
        if (!module) {
            throw new Error(`Module ${moduleName} not found`);
        }
        
        const microflow = microflows.Microflow.createIn(module);
        microflow.name = microflowName;
        
        await model.flushChanges();
        await workingCopy.commitToRepository("main");
    }
    
    /**
     * Create page
     */
    async createPage(workingCopy: OnlineWorkingCopy, moduleName: string, pageName: string): Promise<void> {
        const model = workingCopy.model();
        const module = model.allModules()
            .find((m: any) => m.name === moduleName);
            
        if (!module) {
            throw new Error(`Module ${moduleName} not found`);
        }
        
        const page = pages.Page.createIn(module);
        page.title = pageName;
        
        await model.flushChanges();
        await workingCopy.commitToRepository("main");
    }
}

export * from "mendixplatformsdk";
export * from "mendixmodelsdk";