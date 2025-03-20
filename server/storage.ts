import { 
  users, complianceFrameworks, complianceControls, evidence, 
  sites, devices, changeRequests, tasks, sprints, auditLogs,
  pciDssControls, changeRequestDevices
} from "@shared/schema";
import type { 
  User, InsertUser, 
  ComplianceFramework, InsertComplianceFramework,
  ComplianceControl, InsertComplianceControl,
  Evidence, InsertEvidence,
  Site, InsertSite,
  Device, InsertDevice,
  ChangeRequest, InsertChangeRequest,
  ChangeRequestDevice, InsertChangeRequestDevice,
  Task, InsertTask,
  Sprint, InsertSprint,
  AuditLog, InsertAuditLog,
  PciDssControl, InsertPciDssControl
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc, and, isNull, or } from "drizzle-orm";
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
  getUsersByRole(role: string): Promise<User[]>;
  getUsersWithApprovalRights(): Promise<User[]>;
  
  // Compliance framework management
  createComplianceFramework(framework: InsertComplianceFramework): Promise<ComplianceFramework>;
  getComplianceFramework(id: number): Promise<ComplianceFramework | undefined>;
  listComplianceFrameworks(): Promise<ComplianceFramework[]>;
  
  // Compliance control management
  createComplianceControl(control: InsertComplianceControl): Promise<ComplianceControl>;
  getComplianceControl(id: number): Promise<ComplianceControl | undefined>;
  updateComplianceControl(id: number, control: Partial<InsertComplianceControl>): Promise<ComplianceControl | undefined>;
  listComplianceControls(frameworkId?: number): Promise<ComplianceControl[]>;
  
  // PCI-DSS specific controls and RACI management
  createPciDssControl(control: InsertPciDssControl): Promise<PciDssControl>;
  getPciDssControl(id: number): Promise<PciDssControl | undefined>;
  updatePciDssControl(id: number, control: Partial<InsertPciDssControl>): Promise<PciDssControl | undefined>;
  listPciDssControls(section?: string): Promise<PciDssControl[]>;
  getPciDssControlsByRole(roleId: number): Promise<PciDssControl[]>;
  
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
  listDeviceChildren(parentDeviceId: number): Promise<Device[]>;
  listTopLevelDevices(siteId: number): Promise<Device[]>;
  updateDevice(id: number, device: Partial<InsertDevice>): Promise<Device | undefined>;
  
  // Change request management with RACI matrix support
  createChangeRequest(changeRequest: InsertChangeRequest): Promise<ChangeRequest>;
  getChangeRequest(id: number): Promise<ChangeRequest | undefined>;
  updateChangeRequest(id: number, changeRequest: Partial<ChangeRequest>): Promise<ChangeRequest | undefined>;
  listChangeRequests(): Promise<ChangeRequest[]>;
  getChangeRequestsByStatus(status: string): Promise<ChangeRequest[]>;
  getChangeRequestsForApproval(approverId: number): Promise<ChangeRequest[]>;
  getChangeRequestsRequiredTechnicalApproval(): Promise<ChangeRequest[]>;
  getChangeRequestsRequiredSecurityApproval(): Promise<ChangeRequest[]>;
  getChangeRequestsForImplementation(implementerId?: number): Promise<ChangeRequest[]>;
  
  // Change request to device relationship management
  addDeviceToChangeRequest(changeRequestDevice: InsertChangeRequestDevice): Promise<ChangeRequestDevice>;
  removeDeviceFromChangeRequest(changeRequestId: number, deviceId: number): Promise<void>;
  getDevicesForChangeRequest(changeRequestId: number): Promise<(Device & { impact: string, notes: string | null })[]>;
  getChangeRequestsForDevice(deviceId: number): Promise<ChangeRequest[]>;
  
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
  private pciDssControlsData: Map<number, PciDssControl>;
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
  private pciDssControlIdCounter: number;
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
    this.pciDssControlsData = new Map();
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
    this.pciDssControlIdCounter = 1;
    this.evidenceIdCounter = 1;
    this.siteIdCounter = 1;
    this.deviceIdCounter = 1;
    this.changeRequestIdCounter = 1;
    this.taskIdCounter = 1;
    this.sprintIdCounter = 1;
    this.auditLogIdCounter = 1;
    
    // Initialize with sample data
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
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || 'user',
      avatar: null
    };
    this.users.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === role);
  }
  
  async getUsersWithApprovalRights(): Promise<User[]> {
    // Since we no longer have isApprover field, we'll return users with admin role
    return Array.from(this.users.values())
      .filter(user => user.role === 'admin' || user.role === 'ciso' || user.role === 'cto');
  }
  
  // Compliance framework management
  async createComplianceFramework(framework: InsertComplianceFramework): Promise<ComplianceFramework> {
    const id = this.frameworkIdCounter++;
    const newFramework: ComplianceFramework = { 
      ...framework, 
      id, 
      description: framework.description || null 
    };
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
      description: control.description || null,
      dueDate: control.dueDate || null,
      assignedTo: control.assignedTo || null,
      lastChecked: null
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
  
  // PCI-DSS specific controls and RACI management
  async createPciDssControl(control: InsertPciDssControl): Promise<PciDssControl> {
    const id = this.pciDssControlIdCounter++;
    const newControl: PciDssControl = { 
      ...control, 
      id, 
      description: control.description || null,
      guidance: control.guidance || null,
      responsibleRoleId: control.responsibleRoleId || null,
      accountableRoleId: control.accountableRoleId || null,
      consultedRoleIds: control.consultedRoleIds || [],
      informedRoleIds: control.informedRoleIds || [],
      status: "not_assessed",
      lastAssessedAt: null,
      nextAssessmentDue: null
    };
    this.pciDssControlsData.set(id, newControl);
    return newControl;
  }
  
  async getPciDssControl(id: number): Promise<PciDssControl | undefined> {
    return this.pciDssControlsData.get(id);
  }
  
  async updatePciDssControl(id: number, control: Partial<InsertPciDssControl>): Promise<PciDssControl | undefined> {
    const existingControl = this.pciDssControlsData.get(id);
    if (!existingControl) return undefined;
    
    const updatedControl = { ...existingControl, ...control };
    this.pciDssControlsData.set(id, updatedControl);
    return updatedControl;
  }
  
  async listPciDssControls(section?: string): Promise<PciDssControl[]> {
    const controls = Array.from(this.pciDssControlsData.values());
    if (section !== undefined) {
      return controls.filter(control => control.section === section);
    }
    return controls;
  }
  
  async getPciDssControlsByRole(roleId: number): Promise<PciDssControl[]> {
    return Array.from(this.pciDssControlsData.values())
      .filter(control => 
        control.responsibleRoleId === roleId || 
        control.accountableRoleId === roleId ||
        (control.consultedRoleIds && control.consultedRoleIds.includes(roleId.toString())) ||
        (control.informedRoleIds && control.informedRoleIds.includes(roleId.toString()))
      );
  }
  
  // Evidence management
  async createEvidence(evidenceItem: InsertEvidence): Promise<Evidence> {
    const id = this.evidenceIdCounter++;
    const newEvidence: Evidence = { 
      ...evidenceItem, 
      id, 
      description: evidenceItem.description || null,
      filePath: evidenceItem.filePath || null,
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
    const newSite: Site = { 
      id, 
      name: site.name,
      type: site.type,
      location: site.location || null,
      description: site.description || null
    };
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
    const newDevice: Device = { 
      id,
      siteId: device.siteId,
      parentDeviceId: device.parentDeviceId || null,
      name: device.name,
      type: device.type,
      deviceRole: device.deviceRole || null,
      status: device.status,
      ipAddress: device.ipAddress || null,
      vlan: device.vlan || null,
      operatingSystem: device.operatingSystem || null,
      services: device.services || null
    };
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
  
  async listDeviceChildren(parentDeviceId: number): Promise<Device[]> {
    return Array.from(this.deviceData.values())
      .filter(device => device.parentDeviceId === parentDeviceId);
  }
  
  async listTopLevelDevices(siteId: number): Promise<Device[]> {
    return Array.from(this.deviceData.values())
      .filter(device => device.siteId === siteId && device.parentDeviceId === null);
  }
  
  async updateDevice(id: number, device: Partial<InsertDevice>): Promise<Device | undefined> {
    const existingDevice = this.deviceData.get(id);
    if (!existingDevice) return undefined;
    
    const updatedDevice = { ...existingDevice, ...device };
    this.deviceData.set(id, updatedDevice);
    return updatedDevice;
  }
  
  // Change request management
  async createChangeRequest(changeRequest: InsertChangeRequest): Promise<ChangeRequest> {
    const id = this.changeRequestIdCounter++;
    const newChangeRequest: ChangeRequest = { 
      ...changeRequest, 
      id, 
      status: 'draft',
      riskLevel: changeRequest.riskLevel || 'medium',
      assignedTo: null,
      
      // RACI approval fields
      technicalApprovalStatus: 'pending',
      technicalApproverId: null,
      technicalApprovedAt: null,
      
      securityApprovalStatus: 'pending',
      securityApproverId: null,
      securityApprovedAt: null,
      
      businessApprovalStatus: 'pending',
      businessApproverId: null,
      businessApprovedAt: null,
      
      // Dates
      requestedAt: new Date(),
      scheduledFor: changeRequest.scheduledFor || null,
      implementedAt: null,
      closedAt: null,
      
      // Additional tracking
      affectedSystems: changeRequest.affectedSystems || null,
      backoutPlan: changeRequest.backoutPlan || null,
      relatedControlIds: changeRequest.relatedControlIds || [],
      comments: null
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
  
  async getChangeRequestsByStatus(status: string): Promise<ChangeRequest[]> {
    return Array.from(this.changeRequestData.values())
      .filter(request => request.status === status);
  }
  
  async getChangeRequestsForApproval(approverId: number): Promise<ChangeRequest[]> {
    return Array.from(this.changeRequestData.values())
      .filter(request => 
        (request.status === 'pending_approval') && 
        (
          // Technical approvers
          (request.technicalApprovalStatus === 'pending' && request.technicalApproverId === approverId) ||
          // Security approvers
          (request.securityApprovalStatus === 'pending' && request.securityApproverId === approverId) ||
          // Business approvers
          (request.businessApprovalStatus === 'pending' && request.businessApproverId === approverId)
        )
      );
  }
  
  async getChangeRequestsRequiredTechnicalApproval(): Promise<ChangeRequest[]> {
    return Array.from(this.changeRequestData.values())
      .filter(request => 
        request.status === 'pending_approval' && 
        request.technicalApprovalStatus === 'pending'
      );
  }
  
  async getChangeRequestsRequiredSecurityApproval(): Promise<ChangeRequest[]> {
    return Array.from(this.changeRequestData.values())
      .filter(request => 
        request.status === 'pending_approval' && 
        request.securityApprovalStatus === 'pending'
      );
  }
  
  async getChangeRequestsForImplementation(implementerId?: number): Promise<ChangeRequest[]> {
    const requests = Array.from(this.changeRequestData.values())
      .filter(request => request.status === 'approved');
    
    if (implementerId !== undefined) {
      return requests.filter(request => request.assignedTo === implementerId);
    }
    
    return requests;
  }
  
  // Change request to device relationship management
  private changeRequestDevicesData: Map<number, ChangeRequestDevice> = new Map();
  private changeRequestDeviceIdCounter: number = 1;
  
  async addDeviceToChangeRequest(changeRequestDevice: InsertChangeRequestDevice): Promise<ChangeRequestDevice> {
    const id = this.changeRequestDeviceIdCounter++;
    const newRelation: ChangeRequestDevice = {
      ...changeRequestDevice,
      id,
      impact: changeRequestDevice.impact || 'affected',
      notes: changeRequestDevice.notes || null
    };
    this.changeRequestDevicesData.set(id, newRelation);
    return newRelation;
  }
  
  async removeDeviceFromChangeRequest(changeRequestId: number, deviceId: number): Promise<void> {
    // Find and remove all matching entries
    for (const [id, relation] of this.changeRequestDevicesData.entries()) {
      if (relation.changeRequestId === changeRequestId && relation.deviceId === deviceId) {
        this.changeRequestDevicesData.delete(id);
      }
    }
  }
  
  async getDevicesForChangeRequest(changeRequestId: number): Promise<(Device & { impact: string, notes: string | null })[]> {
    // Get all device relations for this change request
    const relations = Array.from(this.changeRequestDevicesData.values())
      .filter(relation => relation.changeRequestId === changeRequestId);
    
    // Map to full device details with impact and notes
    return relations.map(relation => {
      const device = this.deviceData.get(relation.deviceId);
      if (!device) {
        throw new Error(`Device with ID ${relation.deviceId} not found`);
      }
      return {
        ...device,
        impact: relation.impact,
        notes: relation.notes
      };
    });
  }
  
  async getChangeRequestsForDevice(deviceId: number): Promise<ChangeRequest[]> {
    // Find all change request IDs related to this device
    const changeRequestIds = Array.from(this.changeRequestDevicesData.values())
      .filter(relation => relation.deviceId === deviceId)
      .map(relation => relation.changeRequestId);
    
    // Get the full change request details
    return Array.from(this.changeRequestData.values())
      .filter(request => changeRequestIds.includes(request.id));
  }
  
  // Task management
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const newTask: Task = { 
      id,
      title: task.title,
      status: task.status,
      description: task.description || null,
      dueDate: task.dueDate || null,
      assignedTo: task.assignedTo || null,
      relatedControlId: task.relatedControlId || null,
      sprintId: task.sprintId || null
    };
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
      id, 
      action: auditLog.action,
      userId: auditLog.userId,
      resourceType: auditLog.resourceType,
      resourceId: auditLog.resourceId,
      details: auditLog.details || null,
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
  
  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.role, role));
  }
  
  async getUsersWithApprovalRights(): Promise<User[]> {
    // Since we no longer have isApprover field, we'll return users with admin role
    return await db.select()
      .from(users)
      .where(
        or(
          eq(users.role, 'admin'),
          eq(users.role, 'ciso'),
          eq(users.role, 'cto')
        )
      );
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
  
  // PCI-DSS specific controls and RACI management
  async createPciDssControl(control: InsertPciDssControl): Promise<PciDssControl> {
    const controlWithDefaults = {
      ...control,
      status: "not_assessed",
      lastAssessedAt: null,
      nextAssessmentDue: null,
      description: control.description || null,
      guidance: control.guidance || null,
      responsibleRoleId: control.responsibleRoleId || null,
      accountableRoleId: control.accountableRoleId || null,
      consultedRoleIds: control.consultedRoleIds || [],
      informedRoleIds: control.informedRoleIds || []
    };
    const result = await db.insert(pciDssControls).values(controlWithDefaults).returning();
    return result[0];
  }
  
  async getPciDssControl(id: number): Promise<PciDssControl | undefined> {
    const result = await db.select().from(pciDssControls).where(eq(pciDssControls.id, id));
    return result[0];
  }
  
  async updatePciDssControl(id: number, control: Partial<InsertPciDssControl>): Promise<PciDssControl | undefined> {
    const result = await db.update(pciDssControls)
      .set(control)
      .where(eq(pciDssControls.id, id))
      .returning();
    return result[0];
  }
  
  async listPciDssControls(section?: string): Promise<PciDssControl[]> {
    if (section !== undefined) {
      return await db.select().from(pciDssControls).where(eq(pciDssControls.section, section));
    }
    return await db.select().from(pciDssControls);
  }
  
  async getPciDssControlsByRole(roleId: number): Promise<PciDssControl[]> {
    return await db.select().from(pciDssControls).where(
      or(
        eq(pciDssControls.responsibleRoleId, roleId),
        eq(pciDssControls.accountableRoleId, roleId)
        // Note: For consultedRoleIds and informedRoleIds we would need more complex filtering
        // as these are array fields. This would require SQL-specific array operations
        // which may vary based on the database being used.
      )
    );
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
  
  async listDeviceChildren(parentDeviceId: number): Promise<Device[]> {
    return await db.select().from(devices).where(eq(devices.parentDeviceId, parentDeviceId));
  }
  
  async listTopLevelDevices(siteId: number): Promise<Device[]> {
    return await db.select().from(devices)
      .where(and(
        eq(devices.siteId, siteId),
        isNull(devices.parentDeviceId)
      ));
  }
  
  async updateDevice(id: number, device: Partial<InsertDevice>): Promise<Device | undefined> {
    const result = await db.update(devices)
      .set(device)
      .where(eq(devices.id, id))
      .returning();
    return result[0];
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

  async getChangeRequestsByStatus(status: string): Promise<ChangeRequest[]> {
    return await db.select()
      .from(changeRequests)
      .where(eq(changeRequests.status, status));
  }
  
  async getChangeRequestsForApproval(approverId: number): Promise<ChangeRequest[]> {
    // This is a more complex query where we need to check all approval roles
    return await db.select()
      .from(changeRequests)
      .where(
        and(
          eq(changeRequests.status, 'pending_approval'),
          or(
            and(
              eq(changeRequests.technicalApprovalStatus, 'pending'),
              eq(changeRequests.technicalApproverId, approverId)
            ),
            and(
              eq(changeRequests.securityApprovalStatus, 'pending'),
              eq(changeRequests.securityApproverId, approverId)
            ),
            and(
              eq(changeRequests.businessApprovalStatus, 'pending'),
              eq(changeRequests.businessApproverId, approverId)
            )
          )
        )
      );
  }
  
  async getChangeRequestsRequiredTechnicalApproval(): Promise<ChangeRequest[]> {
    return await db.select()
      .from(changeRequests)
      .where(
        and(
          eq(changeRequests.status, 'pending_approval'),
          eq(changeRequests.technicalApprovalStatus, 'pending')
        )
      );
  }
  
  async getChangeRequestsRequiredSecurityApproval(): Promise<ChangeRequest[]> {
    return await db.select()
      .from(changeRequests)
      .where(
        and(
          eq(changeRequests.status, 'pending_approval'),
          eq(changeRequests.securityApprovalStatus, 'pending')
        )
      );
  }
  
  async getChangeRequestsForImplementation(implementerId?: number): Promise<ChangeRequest[]> {
    if (implementerId !== undefined) {
      return await db.select()
        .from(changeRequests)
        .where(
          and(
            eq(changeRequests.status, 'approved'),
            eq(changeRequests.assignedTo, implementerId)
          )
        );
    }
    
    return await db.select()
      .from(changeRequests)
      .where(eq(changeRequests.status, 'approved'));
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
  
  // Change request to device relationship management
  async addDeviceToChangeRequest(changeRequestDevice: InsertChangeRequestDevice): Promise<ChangeRequestDevice> {
    const result = await db.insert(changeRequestDevices).values(changeRequestDevice).returning();
    return result[0];
  }
  
  async removeDeviceFromChangeRequest(changeRequestId: number, deviceId: number): Promise<void> {
    await db.delete(changeRequestDevices)
      .where(
        and(
          eq(changeRequestDevices.changeRequestId, changeRequestId),
          eq(changeRequestDevices.deviceId, deviceId)
        )
      );
  }
  
  async getDevicesForChangeRequest(changeRequestId: number): Promise<(Device & { impact: string, notes: string | null })[]> {
    const deviceRelations = await db.select()
      .from(changeRequestDevices)
      .where(eq(changeRequestDevices.changeRequestId, changeRequestId));
    
    const result: (Device & { impact: string, notes: string | null })[] = [];
    
    for (const relation of deviceRelations) {
      const deviceResult = await db.select()
        .from(devices)
        .where(eq(devices.id, relation.deviceId));
      
      if (deviceResult.length > 0) {
        result.push({
          ...deviceResult[0],
          impact: relation.impact,
          notes: relation.notes
        });
      }
    }
    
    return result;
  }
  
  async getChangeRequestsForDevice(deviceId: number): Promise<ChangeRequest[]> {
    const changeRequestIds = await db.select()
      .from(changeRequestDevices)
      .where(eq(changeRequestDevices.deviceId, deviceId));
    
    if (changeRequestIds.length === 0) {
      return [];
    }
    
    const ids = changeRequestIds.map(relation => relation.changeRequestId);
    
    return await db.select()
      .from(changeRequests)
      .where(
        ids.map(id => eq(changeRequests.id, id)).reduce((prev, curr) => or(prev, curr))
      );
  }
}

// Use PostgreSQL storage if DATABASE_URL is available, otherwise fallback to memory storage
export const storage = process.env.DATABASE_URL 
  ? new PostgresStorage() 
  : new MemStorage();
