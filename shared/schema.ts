import { pgTable, text, serial, integer, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model with PCI-DSS RACI roles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  // Enhanced roles for RACI matrix
  role: text("role").notNull().default("user"), // admin, ciso, cto, security_manager, network_admin, system_admin, auditor, user
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

// Compliance framework model
export const complianceFrameworks = pgTable("compliance_frameworks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertComplianceFrameworkSchema = createInsertSchema(complianceFrameworks).pick({
  name: true,
  description: true,
});

// Compliance control model
export const complianceControls = pgTable("compliance_controls", {
  id: serial("id").primaryKey(),
  frameworkId: integer("framework_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  severity: text("severity").notNull(), // high, medium, low
  status: text("status").notNull(), // compliant, non-compliant, in-progress
  dueDate: timestamp("due_date"),
  assignedTo: integer("assigned_to"),
  lastChecked: timestamp("last_checked"),
});

export const insertComplianceControlSchema = createInsertSchema(complianceControls).pick({
  frameworkId: true,
  name: true,
  description: true,
  severity: true,
  status: true,
  dueDate: true,
  assignedTo: true,
});

// Evidence model
export const evidence = pgTable("evidence", {
  id: serial("id").primaryKey(),
  controlId: integer("control_id").notNull(),
  description: text("description"),
  filePath: text("file_path"),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertEvidenceSchema = createInsertSchema(evidence).pick({
  controlId: true,
  description: true,
  filePath: true,
  uploadedBy: true,
});

// Site model
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // primary, dr, branch
  location: text("location"),
  description: text("description"),
});

export const insertSiteSchema = createInsertSchema(sites).pick({
  name: true,
  type: true,
  location: true,
  description: true,
});

// Device model
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull(),
  parentDeviceId: integer("parent_device_id"),  // For hierarchical connections
  name: text("name").notNull(),
  type: text("type").notNull(), // server, network, storage, firewall, router, switch
  deviceRole: text("device_role"),  // edge, core, distribution, access, endpoint
  ipAddress: text("ip_address"),
  vlan: text("vlan"),
  operatingSystem: text("operating_system"),
  services: text("services"),
  status: text("status").notNull(),
});

export const insertDeviceSchema = createInsertSchema(devices).pick({
  siteId: true,
  parentDeviceId: true,
  name: true,
  type: true,
  deviceRole: true,
  ipAddress: true,
  vlan: true,
  operatingSystem: true,
  services: true,
  status: true,
});

// Change request model with RACI matrix support and sequential workflow
export const changeRequests = pgTable("change_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  // Enhanced workflow statuses for the sequential approval chain
  status: text("status").notNull().default("draft"), // draft, pending_security_review, pending_technical_review, pending_business_review, approved, rejected, scheduled, implemented, verified, closed
  type: text("type").notNull().default("standard"), // standard, firewall, server, network, emergency
  riskLevel: text("risk_level").notNull().default("medium"), // low, medium, high, critical
  description: text("description").notNull(),
  
  // RACI Matrix Roles
  requestedBy: integer("requested_by").notNull(), // Requester (Responsible)
  assignedTo: integer("assigned_to"), // Implementer (Responsible)
  
  // Multiple approvals based on RACI matrix with sequential workflow
  technicalApprovalStatus: text("technical_approval_status").default("pending"), // pending, approved, rejected
  technicalApproverId: integer("technical_approver_id"), // CTO or delegate (Accountable)
  technicalApprovedAt: timestamp("technical_approved_at"),
  
  securityApprovalStatus: text("security_approval_status").default("pending"), // pending, approved, rejected
  securityApproverId: integer("security_approver_id"), // CISO or delegate (Accountable)
  securityApprovedAt: timestamp("security_approved_at"),
  
  businessApprovalStatus: text("business_approval_status").default("pending"), // pending, approved, rejected
  businessApproverId: integer("business_approver_id"), // Business owner (Accountable)
  businessApprovedAt: timestamp("business_approved_at"),
  
  // Implementation and verification tracking
  implementerId: integer("implementer_id"), // Person who implemented the change
  implementationNotes: text("implementation_notes"), // Notes about how the change was implemented
  
  // Verification (controller)
  verificationStatus: text("verification_status").default("pending"), // pending, verified, failed
  verifierId: integer("verifier_id"), // Person who verified the change (Controller)
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"), // Notes about verification
  
  // Dates for workflow stages
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  scheduledFor: timestamp("scheduled_for"), // When the change is scheduled to occur
  implementedAt: timestamp("implemented_at"),
  closedAt: timestamp("closed_at"),
  
  // Additional tracking
  affectedSystems: text("affected_systems"), // Comma-separated list of systems 
  backoutPlan: text("backout_plan"), // Plan to revert changes if issues occur
  relatedControlIds: text("related_control_ids").array(), // Related compliance controls
  comments: text("comments"), // Any additional notes or comments
  
  // Firewall-specific fields
  firewallRules: text("firewall_rules"), // JSON string containing firewall rule specifications
  sourceIp: text("source_ip"), // Source IP or network
  destinationIp: text("destination_ip"), // Destination IP or network
  portServices: text("port_services"), // Ports and services affected
  action: text("action"), // allow, deny, etc.
});

export const insertChangeRequestSchema = createInsertSchema(changeRequests).pick({
  title: true,
  description: true,
  requestedBy: true,
  type: true,
  riskLevel: true,
  scheduledFor: true,
  affectedSystems: true,
  backoutPlan: true,
  relatedControlIds: true,
  // Firewall-specific fields
  firewallRules: true,
  sourceIp: true,
  destinationIp: true,
  portServices: true,
  action: true,
});

// Task model
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull(), // todo, in-progress, review, completed
  assignedTo: integer("assigned_to"),
  relatedControlId: integer("related_control_id"),
  relatedChangeRequestId: integer("related_change_request_id"),
  priority: text("priority").default("medium"), // low, medium, high, critical
  dueDate: timestamp("due_date"),
  sprintId: integer("sprint_id"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  status: true,
  assignedTo: true,
  relatedControlId: true,
  relatedChangeRequestId: true,
  priority: true,
  dueDate: true,
  sprintId: true,
  createdBy: true,
});

// Sprint model
export const sprints = pgTable("sprints", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull(), // planned, active, completed
});

export const insertSprintSchema = createInsertSchema(sprints).pick({
  name: true,
  startDate: true,
  endDate: true,
  status: true,
});

// PCI-DSS specific controls with RACI matrix
// Change request to device relationship table
export const changeRequestDevices = pgTable("change_request_devices", {
  id: serial("id").primaryKey(),
  changeRequestId: integer("change_request_id").notNull().references(() => changeRequests.id, { onDelete: 'cascade' }),
  deviceId: integer("device_id").notNull().references(() => devices.id, { onDelete: 'cascade' }),
  impact: text("impact").default("affected"), // affected, primary, secondary
  notes: text("notes"),
});

export const insertChangeRequestDeviceSchema = createInsertSchema(changeRequestDevices).pick({
  changeRequestId: true,
  deviceId: true,
  impact: true,
  notes: true,
});

export const pciDssControls = pgTable("pci_dss_controls", {
  id: serial("id").primaryKey(),
  controlNumber: text("control_number").notNull(), // e.g., "1.1.1", "2.2.4"
  requirement: text("requirement").notNull(), // The PCI requirement text
  section: text("section").notNull(), // Primary PCI-DSS section (1-12)
  description: text("description"), // Detailed explanation
  guidance: text("guidance"), // Implementation guidance
  
  // RACI matrix elements
  responsibleRoleId: integer("responsible_role_id"), // Who is responsible for doing the work (R)
  accountableRoleId: integer("accountable_role_id"), // Who has final authority (A)
  consultedRoleIds: text("consulted_role_ids").array(), // Who must be consulted before action (C)
  informedRoleIds: text("informed_role_ids").array(), // Who must be informed after action (I)
  
  // Status tracking
  status: text("status").notNull().default("not_assessed"), // not_assessed, non_compliant, partially_compliant, compliant
  evidenceRequired: boolean("evidence_required").default(true),
  lastAssessedAt: timestamp("last_assessed_at"),
  nextAssessmentDue: timestamp("next_assessment_due"),
});

export const insertPciDssControlSchema = createInsertSchema(pciDssControls).pick({
  controlNumber: true,
  requirement: true,
  section: true,
  description: true,
  guidance: true,
  responsibleRoleId: true,
  accountableRoleId: true,
  consultedRoleIds: true,
  informedRoleIds: true,
  evidenceRequired: true,
});

// Audit log model
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  userId: integer("user_id").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  action: true,
  userId: true,
  resourceType: true,
  resourceId: true,
  details: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ComplianceFramework = typeof complianceFrameworks.$inferSelect;
export type InsertComplianceFramework = z.infer<typeof insertComplianceFrameworkSchema>;

export type ComplianceControl = typeof complianceControls.$inferSelect;
export type InsertComplianceControl = z.infer<typeof insertComplianceControlSchema>;

export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;

export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;

export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

export type ChangeRequest = typeof changeRequests.$inferSelect;
export type InsertChangeRequest = z.infer<typeof insertChangeRequestSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Sprint = typeof sprints.$inferSelect;
export type InsertSprint = z.infer<typeof insertSprintSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type PciDssControl = typeof pciDssControls.$inferSelect;
export type InsertPciDssControl = z.infer<typeof insertPciDssControlSchema>;

export type ChangeRequestDevice = typeof changeRequestDevices.$inferSelect;
export type InsertChangeRequestDevice = z.infer<typeof insertChangeRequestDeviceSchema>;
