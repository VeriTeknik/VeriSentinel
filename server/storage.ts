import { 
  users, complianceFrameworks, complianceControls, evidence, 
  sites, devices, changeRequests, tasks, sprints, auditLogs 
} from "@shared/schema";
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
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import connectPg from "connect-pg-simple";
import pg from "pg";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;

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
  sessionStore: session.Store;
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

// PostgreSQL database storage implementation
import { pool, db } from './db';

export class PostgresStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Create a session store using PostgreSQL
    this.sessionStore = new PostgresSessionStore({
      pool: pool,
      createTableIfMissing: true,
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Compliance framework management
  async createComplianceFramework(framework: InsertComplianceFramework): Promise<ComplianceFramework> {
    const result = await db.insert(complianceFrameworks).values(framework).returning();
    return result[0];
  }

  async getComplianceFramework(id: number): Promise<ComplianceFramework | undefined> {
    const result = await db.select().from(complianceFrameworks).where(eq(complianceFrameworks.id, id));
    return result[0];
  }

  async listComplianceFrameworks(): Promise<ComplianceFramework[]> {
    return await db.select().from(complianceFrameworks);
  }

  // Compliance control management
  async createComplianceControl(control: InsertComplianceControl): Promise<ComplianceControl> {
    const result = await db.insert(complianceControls).values(control).returning();
    return result[0];
  }

  async getComplianceControl(id: number): Promise<ComplianceControl | undefined> {
    const result = await db.select().from(complianceControls).where(eq(complianceControls.id, id));
    return result[0];
  }

  async updateComplianceControl(id: number, control: Partial<InsertComplianceControl>): Promise<ComplianceControl | undefined> {
    const result = await db.update(complianceControls)
      .set(control)
      .where(eq(complianceControls.id, id))
      .returning();
    return result[0];
  }

  async listComplianceControls(frameworkId?: number): Promise<ComplianceControl[]> {
    if (frameworkId !== undefined) {
      return await db.select().from(complianceControls).where(eq(complianceControls.frameworkId, frameworkId));
    }
    return await db.select().from(complianceControls);
  }

  // Evidence management
  async createEvidence(evidenceItem: InsertEvidence): Promise<Evidence> {
    const itemWithDate = { ...evidenceItem, uploadedAt: new Date() };
    const result = await db.insert(evidence).values(itemWithDate).returning();
    return result[0];
  }

  async getEvidence(id: number): Promise<Evidence | undefined> {
    const result = await db.select().from(evidence).where(eq(evidence.id, id));
    return result[0];
  }

  async listEvidenceByControl(controlId: number): Promise<Evidence[]> {
    return await db.select().from(evidence).where(eq(evidence.controlId, controlId));
  }

  // Site management
  async createSite(site: InsertSite): Promise<Site> {
    const result = await db.insert(sites).values(site).returning();
    return result[0];
  }

  async getSite(id: number): Promise<Site | undefined> {
    const result = await db.select().from(sites).where(eq(sites.id, id));
    return result[0];
  }

  async listSites(): Promise<Site[]> {
    return await db.select().from(sites);
  }

  // Device management
  async createDevice(device: InsertDevice): Promise<Device> {
    const result = await db.insert(devices).values(device).returning();
    return result[0];
  }

  async getDevice(id: number): Promise<Device | undefined> {
    const result = await db.select().from(devices).where(eq(devices.id, id));
    return result[0];
  }

  async listDevices(siteId?: number): Promise<Device[]> {
    if (siteId !== undefined) {
      return await db.select().from(devices).where(eq(devices.siteId, siteId));
    }
    return await db.select().from(devices);
  }

  // Change request management
  async createChangeRequest(changeRequest: InsertChangeRequest): Promise<ChangeRequest> {
    const requestWithDefaults = {
      ...changeRequest,
      status: 'pending',
      requestedAt: new Date(),
    };
    const result = await db.insert(changeRequests).values(requestWithDefaults).returning();
    return result[0];
  }

  async getChangeRequest(id: number): Promise<ChangeRequest | undefined> {
    const result = await db.select().from(changeRequests).where(eq(changeRequests.id, id));
    return result[0];
  }

  async updateChangeRequest(id: number, changeRequest: Partial<ChangeRequest>): Promise<ChangeRequest | undefined> {
    const result = await db.update(changeRequests)
      .set(changeRequest)
      .where(eq(changeRequests.id, id))
      .returning();
    return result[0];
  }

  async listChangeRequests(): Promise<ChangeRequest[]> {
    return await db.select().from(changeRequests);
  }

  // Task management
  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async getTask(id: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks)
      .set(task)
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async listTasks(status?: string): Promise<Task[]> {
    if (status !== undefined) {
      return await db.select().from(tasks).where(eq(tasks.status, status));
    }
    return await db.select().from(tasks);
  }

  // Sprint management
  async createSprint(sprint: InsertSprint): Promise<Sprint> {
    const result = await db.insert(sprints).values(sprint).returning();
    return result[0];
  }

  async getSprint(id: number): Promise<Sprint | undefined> {
    const result = await db.select().from(sprints).where(eq(sprints.id, id));
    return result[0];
  }

  async listSprints(): Promise<Sprint[]> {
    return await db.select().from(sprints);
  }

  // Audit log management
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const logWithTimestamp = { ...auditLog, timestamp: new Date() };
    const result = await db.insert(auditLogs).values(logWithTimestamp).returning();
    return result[0];
  }

  async listAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
  }
}

// Use PostgreSQL storage if DATABASE_URL is available, otherwise fallback to memory storage
export const storage = process.env.DATABASE_URL 
  ? new PostgresStorage() 
  : new MemStorage();
