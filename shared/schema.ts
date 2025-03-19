import { pgTable, text, serial, integer, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
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
  name: text("name").notNull(),
  type: text("type").notNull(), // server, network, storage
  ipAddress: text("ip_address"),
  vlan: text("vlan"),
  operatingSystem: text("operating_system"),
  services: text("services"),
  status: text("status").notNull(),
});

export const insertDeviceSchema = createInsertSchema(devices).pick({
  siteId: true,
  name: true,
  type: true,
  ipAddress: true,
  vlan: true,
  operatingSystem: true,
  services: true,
  status: true,
});

// Change request model
export const changeRequests = pgTable("change_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Replaces type
  status: text("status").notNull(), // pending, approved, rejected, implemented
  description: text("description").notNull(), // Replaces details
  requestedBy: integer("requested_by").notNull(), // Replaces requesterId
  approverId: integer("approver_id"),
  implementerId: integer("implementer_id"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  implementedAt: timestamp("implemented_at"),
});

export const insertChangeRequestSchema = createInsertSchema(changeRequests).pick({
  title: true, 
  description: true,
  requestedBy: true,
});

// Task model
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull(), // todo, in-progress, review, completed
  assignedTo: integer("assigned_to"),
  relatedControlId: integer("related_control_id"),
  dueDate: timestamp("due_date"),
  sprintId: integer("sprint_id"),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  status: true,
  assignedTo: true,
  relatedControlId: true,
  dueDate: true,
  sprintId: true,
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
