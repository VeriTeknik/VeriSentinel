import { users, complianceFrameworks, complianceControls, evidence, sites, devices, changeRequests, tasks, sprints, auditLogs } from "@shared/schema";
import type { 
  User, InsertUser, 
  ComplianceFramework, InsertComplianceFramework,
  ComplianceControl, InsertComplianceControl,
  Evidence, InsertEvidence,
  Site, InsertSite,
  Device, InsertDevice,
  ChangeRequest, InsertChangeRequest,
  Task, InsertTask,
  Sprint, InsertSprint,
  AuditLog, InsertAuditLog
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.SessionStore;

  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  
  // Compliance framework management
  createComplianceFramework(framework: InsertComplianceFramework): Promise<ComplianceFramework>;
  getComplianceFramework(id: number): Promise<ComplianceFramework | undefined>;
  listComplianceFrameworks(): Promise<ComplianceFramework[]>;
  
  // Compliance control management
  createComplianceControl(control: InsertComplianceControl): Promise<ComplianceControl>;
  getComplianceControl(id: number): Promise<ComplianceControl | undefined>;
  updateComplianceControl(id: number, control: Partial<InsertComplianceControl>): Promise<ComplianceControl | undefined>;
  listComplianceControls(frameworkId?: number): Promise<ComplianceControl[]>;
  
  // Evidence management
  createEvidence(evidenceItem: InsertEvidence): Promise<Evidence>;
  getEvidence(id: number): Promise<Evidence | undefined>;
  listEvidenceByControl(controlId: number): Promise<Evidence[]>;
  
  // Site management
  createSite(site: InsertSite): Promise<Site>;
  getSite(id: number): Promise<Site | undefined>;
  listSites(): Promise<Site[]>;
  
  // Device management
  createDevice(device: InsertDevice): Promise<Device>;
  getDevice(id: number): Promise<Device | undefined>;
  listDevices(siteId?: number): Promise<Device[]>;
  
  // Change request management
  createChangeRequest(changeRequest: InsertChangeRequest): Promise<ChangeRequest>;
  getChangeRequest(id: number): Promise<ChangeRequest | undefined>;
  updateChangeRequest(id: number, changeRequest: Partial<ChangeRequest>): Promise<ChangeRequest | undefined>;
  listChangeRequests(): Promise<ChangeRequest[]>;
  
  // Task management
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  listTasks(status?: string): Promise<Task[]>;
  
  // Sprint management
  createSprint(sprint: InsertSprint): Promise<Sprint>;
  getSprint(id: number): Promise<Sprint | undefined>;
  listSprints(): Promise<Sprint[]>;
  
  // Audit log management
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  listAuditLogs(): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  sessionStore: session.SessionStore;
  private users: Map<number, User>;
  private complianceFrameworks: Map<number, ComplianceFramework>;
  private complianceControls: Map<number, ComplianceControl>;
  private evidenceItems: Map<number, Evidence>;
  private siteData: Map<number, Site>;
  private deviceData: Map<number, Device>;
  private changeRequestData: Map<number, ChangeRequest>;
  private taskData: Map<number, Task>;
  private sprintData: Map<number, Sprint>;
  private auditLogData: Map<number, AuditLog>;
  
  private userIdCounter: number;
  private frameworkIdCounter: number;
  private controlIdCounter: number;
  private evidenceIdCounter: number;
  private siteIdCounter: number;
  private deviceIdCounter: number;
  private changeRequestIdCounter: number;
  private taskIdCounter: number;
  private sprintIdCounter: number;
  private auditLogIdCounter: number;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    this.users = new Map();
    this.complianceFrameworks = new Map();
    this.complianceControls = new Map();
    this.evidenceItems = new Map();
    this.siteData = new Map();
    this.deviceData = new Map();
    this.changeRequestData = new Map();
    this.taskData = new Map();
    this.sprintData = new Map();
    this.auditLogData = new Map();
    
    this.userIdCounter = 1;
    this.frameworkIdCounter = 1;
    this.controlIdCounter = 1;
    this.evidenceIdCounter = 1;
    this.siteIdCounter = 1;
    this.deviceIdCounter = 1;
    this.changeRequestIdCounter = 1;
    this.taskIdCounter = 1;
    this.sprintIdCounter = 1;
    this.auditLogIdCounter = 1;
    
    // Initialize with sample data (uncomment if needed)
    this.initializeData();
  }

  private initializeData() {
    // This would be used to initialize sample data if needed
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Compliance framework management
  async createComplianceFramework(framework: InsertComplianceFramework): Promise<ComplianceFramework> {
    const id = this.frameworkIdCounter++;
    const newFramework: ComplianceFramework = { ...framework, id };
    this.complianceFrameworks.set(id, newFramework);
    return newFramework;
  }

  async getComplianceFramework(id: number): Promise<ComplianceFramework | undefined> {
    return this.complianceFrameworks.get(id);
  }

  async listComplianceFrameworks(): Promise<ComplianceFramework[]> {
    return Array.from(this.complianceFrameworks.values());
  }
  
  // Compliance control management
  async createComplianceControl(control: InsertComplianceControl): Promise<ComplianceControl> {
    const id = this.controlIdCounter++;
    const newControl: ComplianceControl = { 
      ...control, 
      id, 
      lastChecked: control.lastChecked || null
    };
    this.complianceControls.set(id, newControl);
    return newControl;
  }

  async getComplianceControl(id: number): Promise<ComplianceControl | undefined> {
    return this.complianceControls.get(id);
  }

  async updateComplianceControl(id: number, control: Partial<InsertComplianceControl>): Promise<ComplianceControl | undefined> {
    const existingControl = this.complianceControls.get(id);
    if (!existingControl) return undefined;
    
    const updatedControl = { ...existingControl, ...control };
    this.complianceControls.set(id, updatedControl);
    return updatedControl;
  }

  async listComplianceControls(frameworkId?: number): Promise<ComplianceControl[]> {
    const controls = Array.from(this.complianceControls.values());
    if (frameworkId !== undefined) {
      return controls.filter(control => control.frameworkId === frameworkId);
    }
    return controls;
  }
  
  // Evidence management
  async createEvidence(evidenceItem: InsertEvidence): Promise<Evidence> {
    const id = this.evidenceIdCounter++;
    const newEvidence: Evidence = { 
      ...evidenceItem, 
      id, 
      uploadedAt: new Date() 
    };
    this.evidenceItems.set(id, newEvidence);
    return newEvidence;
  }

  async getEvidence(id: number): Promise<Evidence | undefined> {
    return this.evidenceItems.get(id);
  }

  async listEvidenceByControl(controlId: number): Promise<Evidence[]> {
    return Array.from(this.evidenceItems.values())
      .filter(evidence => evidence.controlId === controlId);
  }
  
  // Site management
  async createSite(site: InsertSite): Promise<Site> {
    const id = this.siteIdCounter++;
    const newSite: Site = { ...site, id };
    this.siteData.set(id, newSite);
    return newSite;
  }

  async getSite(id: number): Promise<Site | undefined> {
    return this.siteData.get(id);
  }

  async listSites(): Promise<Site[]> {
    return Array.from(this.siteData.values());
  }
  
  // Device management
  async createDevice(device: InsertDevice): Promise<Device> {
    const id = this.deviceIdCounter++;
    const newDevice: Device = { ...device, id };
    this.deviceData.set(id, newDevice);
    return newDevice;
  }

  async getDevice(id: number): Promise<Device | undefined> {
    return this.deviceData.get(id);
  }

  async listDevices(siteId?: number): Promise<Device[]> {
    const devices = Array.from(this.deviceData.values());
    if (siteId !== undefined) {
      return devices.filter(device => device.siteId === siteId);
    }
    return devices;
  }
  
  // Change request management
  async createChangeRequest(changeRequest: InsertChangeRequest): Promise<ChangeRequest> {
    const id = this.changeRequestIdCounter++;
    const newChangeRequest: ChangeRequest = { 
      ...changeRequest, 
      id, 
      status: 'pending',
      approverId: null,
      implementerId: null,
      requestedAt: new Date(),
      approvedAt: null,
      implementedAt: null
    };
    this.changeRequestData.set(id, newChangeRequest);
    return newChangeRequest;
  }

  async getChangeRequest(id: number): Promise<ChangeRequest | undefined> {
    return this.changeRequestData.get(id);
  }

  async updateChangeRequest(id: number, changeRequest: Partial<ChangeRequest>): Promise<ChangeRequest | undefined> {
    const existingRequest = this.changeRequestData.get(id);
    if (!existingRequest) return undefined;
    
    const updatedRequest = { ...existingRequest, ...changeRequest };
    this.changeRequestData.set(id, updatedRequest);
    return updatedRequest;
  }

  async listChangeRequests(): Promise<ChangeRequest[]> {
    return Array.from(this.changeRequestData.values());
  }
  
  // Task management
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const newTask: Task = { ...task, id };
    this.taskData.set(id, newTask);
    return newTask;
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.taskData.get(id);
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.taskData.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...task };
    this.taskData.set(id, updatedTask);
    return updatedTask;
  }

  async listTasks(status?: string): Promise<Task[]> {
    const tasks = Array.from(this.taskData.values());
    if (status !== undefined) {
      return tasks.filter(task => task.status === status);
    }
    return tasks;
  }
  
  // Sprint management
  async createSprint(sprint: InsertSprint): Promise<Sprint> {
    const id = this.sprintIdCounter++;
    const newSprint: Sprint = { ...sprint, id };
    this.sprintData.set(id, newSprint);
    return newSprint;
  }

  async getSprint(id: number): Promise<Sprint | undefined> {
    return this.sprintData.get(id);
  }

  async listSprints(): Promise<Sprint[]> {
    return Array.from(this.sprintData.values());
  }
  
  // Audit log management
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const id = this.auditLogIdCounter++;
    const newAuditLog: AuditLog = { 
      ...auditLog, 
      id, 
      timestamp: new Date() 
    };
    this.auditLogData.set(id, newAuditLog);
    return newAuditLog;
  }

  async listAuditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogData.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();
