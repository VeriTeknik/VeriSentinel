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
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, and, isNull, or, inArray } from "drizzle-orm";
import pg from "pg";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";

const PostgresSessionStore = connectPgSimple(session);

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
  
  // Change request management
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

  updateUser(id: number, data: Partial<InsertUser>): Promise<User | null>;
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
    // Check if this is the first user
    const existingUsers = await db.select().from(users);
    
    const userToCreate = {
      ...user,
      // Make first user admin, otherwise use provided role or default to user
      role: existingUsers.length === 0 ? 'admin' : (user.role || 'user')
    };
    
    const result = await db.insert(users).values(userToCreate).returning();
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
    try {
      const results = await db.select().from(changeRequests);
      return results;
    } catch (error) {
      console.error('Error in listChangeRequests:', error);
      return [];
    }
  }

  async getChangeRequestsByStatus(status: string): Promise<ChangeRequest[]> {
    return await db.select()
      .from(changeRequests)
      .where(eq(changeRequests.status, status));
  }
  
  async getChangeRequestsForApproval(approverId: number): Promise<ChangeRequest[]> {
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
    const taskWithDefaults = {
      ...task,
      priority: task.priority || "medium",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.insert(tasks).values(taskWithDefaults).returning();
    return result[0];
  }

  async getTask(id: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const taskWithUpdatedAt = {
      ...task,
      updatedAt: new Date()
    };
    const result = await db.update(tasks)
      .set(taskWithUpdatedAt)
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
          impact: relation.impact ?? 'affected',
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
    
    const result = await db.execute(`
      SELECT * FROM "change_requests" 
      WHERE "id" IN (${ids.join(',')})
    `);
    
    return result as unknown as ChangeRequest[];
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | null> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...data,
          ...(data.password ? { password: await bcrypt.hash(data.password, 10) } : {})
        })
        .where(eq(users.id, id))
        .returning();

      return updatedUser || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

// Export PostgreSQL storage instance
export const storage = new PostgresStorage();
