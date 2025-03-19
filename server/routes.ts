import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertComplianceFrameworkSchema, 
  insertComplianceControlSchema,
  insertEvidenceSchema,
  insertSiteSchema,
  insertDeviceSchema,
  insertChangeRequestSchema,
  insertTaskSchema,
  insertSprintSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Log action to audit log
  const logAuditAction = async (userId: number, action: string, resourceType: string, resourceId: string, details: string) => {
    await storage.createAuditLog({
      action,
      userId,
      resourceType,
      resourceId,
      details
    });
  };

  // Compliance Frameworks API
  app.get("/api/compliance-frameworks", isAuthenticated, async (req, res) => {
    try {
      const frameworks = await storage.listComplianceFrameworks();
      res.json(frameworks);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve compliance frameworks" });
    }
  });

  app.post("/api/compliance-frameworks", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertComplianceFrameworkSchema.parse(req.body);
      const framework = await storage.createComplianceFramework(validatedData);
      
      await logAuditAction(
        req.user!.id,
        "create_framework",
        "compliance_framework",
        framework.id.toString(),
        `Created compliance framework: ${framework.name}`
      );
      
      res.status(201).json(framework);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create compliance framework" });
    }
  });

  // Compliance Controls API
  app.get("/api/compliance-controls", isAuthenticated, async (req, res) => {
    try {
      const frameworkId = req.query.frameworkId ? parseInt(req.query.frameworkId as string) : undefined;
      const controls = await storage.listComplianceControls(frameworkId);
      res.json(controls);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve compliance controls" });
    }
  });

  app.post("/api/compliance-controls", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertComplianceControlSchema.parse(req.body);
      const control = await storage.createComplianceControl(validatedData);
      
      await logAuditAction(
        req.user!.id,
        "create_control",
        "compliance_control",
        control.id.toString(),
        `Created compliance control: ${control.name}`
      );
      
      res.status(201).json(control);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create compliance control" });
    }
  });

  app.put("/api/compliance-controls/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingControl = await storage.getComplianceControl(id);
      
      if (!existingControl) {
        return res.status(404).json({ message: "Compliance control not found" });
      }
      
      // Only validate the fields that are being updated
      const updateData = {};
      Object.keys(req.body).forEach(key => {
        if (key in insertComplianceControlSchema.shape) {
          (updateData as any)[key] = req.body[key];
        }
      });
      
      const control = await storage.updateComplianceControl(id, updateData);
      
      await logAuditAction(
        req.user!.id,
        "update_control",
        "compliance_control",
        id.toString(),
        `Updated compliance control: ${control!.name}`
      );
      
      res.json(control);
    } catch (error) {
      res.status(500).json({ message: "Failed to update compliance control" });
    }
  });

  // Evidence API
  app.get("/api/compliance-controls/:id/evidence", isAuthenticated, async (req, res) => {
    try {
      const controlId = parseInt(req.params.id);
      const evidenceList = await storage.listEvidenceByControl(controlId);
      res.json(evidenceList);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve evidence" });
    }
  });

  app.post("/api/evidence", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEvidenceSchema.parse({
        ...req.body,
        uploadedBy: req.user!.id
      });
      
      const evidence = await storage.createEvidence(validatedData);
      
      await logAuditAction(
        req.user!.id,
        "upload_evidence",
        "evidence",
        evidence.id.toString(),
        `Uploaded evidence for control ID: ${evidence.controlId}`
      );
      
      res.status(201).json(evidence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to upload evidence" });
    }
  });

  // Sites API
  app.get("/api/sites", isAuthenticated, async (req, res) => {
    try {
      const sites = await storage.listSites();
      res.json(sites);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve sites" });
    }
  });

  app.post("/api/sites", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSiteSchema.parse(req.body);
      const site = await storage.createSite(validatedData);
      
      await logAuditAction(
        req.user!.id,
        "create_site",
        "site",
        site.id.toString(),
        `Created site: ${site.name}`
      );
      
      res.status(201).json(site);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create site" });
    }
  });

  // Devices API
  app.get("/api/devices", isAuthenticated, async (req, res) => {
    try {
      const siteId = req.query.siteId ? parseInt(req.query.siteId as string) : undefined;
      const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
      const topLevelOnly = req.query.topLevelOnly === 'true';
      
      console.log('Devices API request:', { siteId, parentId, topLevelOnly });
      
      // Get devices based on the query parameters
      let devices;
      if (parentId) {
        // Get children of a specific device
        devices = await storage.listDeviceChildren(parentId);
      } else if (siteId && topLevelOnly) {
        // Get only top-level devices for a site
        devices = await storage.listTopLevelDevices(siteId);
      } else {
        // Get all devices, optionally filtered by site
        devices = await storage.listDevices(siteId);
      }
      
      res.json(devices);
    } catch (error) {
      console.error('Error in /api/devices endpoint:', error);
      res.status(500).json({ message: "Failed to retrieve devices", error: String(error) });
    }
  });

  app.post("/api/devices", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDeviceSchema.parse(req.body);
      const device = await storage.createDevice(validatedData);
      
      await logAuditAction(
        req.user!.id,
        "create_device",
        "device",
        device.id.toString(),
        `Created device: ${device.name}`
      );
      
      res.status(201).json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create device" });
    }
  });

  // Network Topology API (special endpoint that combines sites and devices data with hierarchical structure)
  app.get("/api/topology", isAuthenticated, async (req, res) => {
    try {
      console.log('Topology API request received');
      const sites = await storage.listSites();
      console.log('Sites fetched successfully:', sites.length);
      
      const allDevices = await storage.listDevices();
      console.log('All devices fetched successfully:', allDevices.length);
      
      // Create a topology map with sites and their top-level devices
      const topology = await Promise.all(sites.map(async site => {
        console.log(`Processing site ${site.id}: ${site.name}`);
        // Get the top-level devices for this site
        const topLevelDevices = await storage.listTopLevelDevices(site.id);
        console.log(`Top level devices for site ${site.id}:`, topLevelDevices.length);
        
        // For each top-level device, find its children recursively
        const processedDevices = await Promise.all(
          topLevelDevices.map(async device => {
            const childDevices = await storage.listDeviceChildren(device.id);
            console.log(`Child devices for device ${device.id}:`, childDevices.length);
            return {
              ...device,
              children: childDevices
            };
          })
        );
        
        return {
          ...site,
          devices: processedDevices
        };
      }));
      
      console.log('Topology processed successfully, returning response');
      res.json(topology);
    } catch (error) {
      console.error('Error in /api/topology endpoint:', error);
      res.status(500).json({ message: "Failed to retrieve network topology", error: String(error) });
    }
  });

  // Change Requests API
  app.get("/api/change-requests", isAuthenticated, async (req, res) => {
    try {
      const changeRequests = await storage.listChangeRequests();
      res.json(changeRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve change requests" });
    }
  });

  app.post("/api/change-requests", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertChangeRequestSchema.parse({
        ...req.body,
        requestedBy: req.user!.id
      });
      
      const changeRequest = await storage.createChangeRequest(validatedData);
      
      await logAuditAction(
        req.user!.id,
        "create_change_request",
        "change_request",
        changeRequest.id.toString(),
        `Created change request: ${changeRequest.title}`
      );
      
      res.status(201).json(changeRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create change request" });
    }
  });

  // Approve change request
  app.put("/api/change-requests/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const changeRequest = await storage.getChangeRequest(id);
      
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      if (changeRequest.status !== "pending") {
        return res.status(400).json({ message: "Change request is not in pending status" });
      }
      
      // Only certain roles can approve change requests
      if (req.user!.role !== "admin" && req.user!.role !== "approver") {
        return res.status(403).json({ message: "Not authorized to approve change requests" });
      }
      
      const updatedRequest = await storage.updateChangeRequest(id, {
        status: "approved",
        approverId: req.user!.id,
        approvedAt: new Date()
      });
      
      await logAuditAction(
        req.user!.id,
        "approve_change_request",
        "change_request",
        id.toString(),
        `Approved change request ID: ${id}`
      );
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve change request" });
    }
  });

  // Implement change request
  app.put("/api/change-requests/:id/implement", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const changeRequest = await storage.getChangeRequest(id);
      
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      if (changeRequest.status !== "approved") {
        return res.status(400).json({ message: "Change request must be approved before implementation" });
      }
      
      // Only certain roles can implement change requests
      if (req.user!.role !== "admin" && req.user!.role !== "implementer") {
        return res.status(403).json({ message: "Not authorized to implement change requests" });
      }
      
      const updatedRequest = await storage.updateChangeRequest(id, {
        status: "implemented",
        implementerId: req.user!.id,
        implementedAt: new Date()
      });
      
      await logAuditAction(
        req.user!.id,
        "implement_change_request",
        "change_request",
        id.toString(),
        `Implemented change request ID: ${id}`
      );
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to implement change request" });
    }
  });

  // Tasks API
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const tasks = await storage.listTasks(status);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      
      await logAuditAction(
        req.user!.id,
        "create_task",
        "task",
        task.id.toString(),
        `Created task: ${task.title}`
      );
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingTask = await storage.getTask(id);
      
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Only validate the fields that are being updated
      const updateData = {};
      Object.keys(req.body).forEach(key => {
        if (key in insertTaskSchema.shape) {
          (updateData as any)[key] = req.body[key];
        }
      });
      
      const task = await storage.updateTask(id, updateData);
      
      await logAuditAction(
        req.user!.id,
        "update_task",
        "task",
        id.toString(),
        `Updated task: ${task!.title}`
      );
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Sprints API
  app.get("/api/sprints", isAuthenticated, async (req, res) => {
    try {
      const sprints = await storage.listSprints();
      res.json(sprints);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve sprints" });
    }
  });

  app.post("/api/sprints", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSprintSchema.parse(req.body);
      const sprint = await storage.createSprint(validatedData);
      
      await logAuditAction(
        req.user!.id,
        "create_sprint",
        "sprint",
        sprint.id.toString(),
        `Created sprint: ${sprint.name}`
      );
      
      res.status(201).json(sprint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sprint" });
    }
  });

  // Audit Logs API
  app.get("/api/audit-logs", isAuthenticated, async (req, res) => {
    try {
      // Only admins can view all audit logs
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to view audit logs" });
      }
      
      const auditLogs = await storage.listAuditLogs();
      res.json(auditLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve audit logs" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
