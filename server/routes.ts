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

  // Submit change request for security review
  app.put("/api/change-requests/:id/submit", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const changeRequest = await storage.getChangeRequest(id);
      
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      if (changeRequest.status !== "draft") {
        return res.status(400).json({ message: "Change request must be in draft status to submit" });
      }
      
      // Only the requester or admin can submit the change request
      if (changeRequest.requestedBy !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to submit this change request" });
      }
      
      // Determine the first approval stage based on the type of change
      let nextStatus = "pending_security_review";
      if (changeRequest.type === "emergency") {
        nextStatus = "pending_technical_review"; // Skip security review for emergency changes
      }
      
      const updatedRequest = await storage.updateChangeRequest(id, {
        status: nextStatus
      });
      
      await logAuditAction(
        req.user!.id,
        "submit_change_request",
        "change_request",
        id.toString(),
        `Submitted change request ID: ${id} for approval`
      );
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit change request" });
    }
  });

  // Security approval step
  app.put("/api/change-requests/:id/security-approval", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { approved, comments } = req.body;
      const changeRequest = await storage.getChangeRequest(id);
      
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      if (changeRequest.status !== "pending_security_review") {
        return res.status(400).json({ message: "Change request is not awaiting security review" });
      }
      
      // Only security roles can provide security approval
      if (req.user!.role !== "admin" && req.user!.role !== "ciso" && req.user!.role !== "security_manager") {
        return res.status(403).json({ message: "Not authorized to provide security approval" });
      }
      
      // If rejected, update status and don't proceed further
      if (!approved) {
        const updatedRequest = await storage.updateChangeRequest(id, {
          status: "rejected",
          securityApprovalStatus: "rejected",
          securityApproverId: req.user!.id,
          securityApprovedAt: new Date(),
          comments: comments || changeRequest.comments
        });
        
        await logAuditAction(
          req.user!.id,
          "reject_security_approval",
          "change_request",
          id.toString(),
          `Rejected security approval for change request ID: ${id}`
        );
        
        return res.json(updatedRequest);
      }
      
      // If approved, move to the next stage (technical review)
      const updatedRequest = await storage.updateChangeRequest(id, {
        status: "pending_technical_review",
        securityApprovalStatus: "approved",
        securityApproverId: req.user!.id,
        securityApprovedAt: new Date(),
        comments: comments || changeRequest.comments
      });
      
      await logAuditAction(
        req.user!.id,
        "approve_security_review",
        "change_request",
        id.toString(),
        `Approved security review for change request ID: ${id}`
      );
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to process security approval" });
    }
  });

  // Technical approval step
  app.put("/api/change-requests/:id/technical-approval", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { approved, comments } = req.body;
      const changeRequest = await storage.getChangeRequest(id);
      
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      if (changeRequest.status !== "pending_technical_review") {
        return res.status(400).json({ message: "Change request is not awaiting technical review" });
      }
      
      // Only technical roles can provide technical approval
      if (req.user!.role !== "admin" && req.user!.role !== "cto" && req.user!.role !== "network_admin") {
        return res.status(403).json({ message: "Not authorized to provide technical approval" });
      }
      
      // If rejected, update status and don't proceed further
      if (!approved) {
        const updatedRequest = await storage.updateChangeRequest(id, {
          status: "rejected",
          technicalApprovalStatus: "rejected",
          technicalApproverId: req.user!.id,
          technicalApprovedAt: new Date(),
          comments: comments || changeRequest.comments
        });
        
        await logAuditAction(
          req.user!.id,
          "reject_technical_approval",
          "change_request",
          id.toString(),
          `Rejected technical approval for change request ID: ${id}`
        );
        
        return res.json(updatedRequest);
      }
      
      // If approved, move to the next stage (business review for high-risk, or directly approved for lower risk)
      let nextStatus = "pending_business_review";
      if (changeRequest.riskLevel === "low" || changeRequest.riskLevel === "medium") {
        nextStatus = "approved"; // Skip business review for low/medium risk changes
      }
      
      const updatedRequest = await storage.updateChangeRequest(id, {
        status: nextStatus,
        technicalApprovalStatus: "approved",
        technicalApproverId: req.user!.id,
        technicalApprovedAt: new Date(),
        comments: comments || changeRequest.comments
      });
      
      await logAuditAction(
        req.user!.id,
        "approve_technical_review",
        "change_request",
        id.toString(),
        `Approved technical review for change request ID: ${id}, new status: ${nextStatus}`
      );
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to process technical approval" });
    }
  });

  // Business approval step (for high-risk changes)
  app.put("/api/change-requests/:id/business-approval", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { approved, comments } = req.body;
      const changeRequest = await storage.getChangeRequest(id);
      
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      if (changeRequest.status !== "pending_business_review") {
        return res.status(400).json({ message: "Change request is not awaiting business review" });
      }
      
      // Only management roles can provide business approval
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to provide business approval" });
      }
      
      // If rejected, update status and don't proceed further
      if (!approved) {
        const updatedRequest = await storage.updateChangeRequest(id, {
          status: "rejected",
          businessApprovalStatus: "rejected",
          businessApproverId: req.user!.id,
          businessApprovedAt: new Date(),
          comments: comments || changeRequest.comments
        });
        
        await logAuditAction(
          req.user!.id,
          "reject_business_approval",
          "change_request",
          id.toString(),
          `Rejected business approval for change request ID: ${id}`
        );
        
        return res.json(updatedRequest);
      }
      
      // If approved, mark as approved and ready for implementation
      const updatedRequest = await storage.updateChangeRequest(id, {
        status: "approved",
        businessApprovalStatus: "approved",
        businessApproverId: req.user!.id,
        businessApprovedAt: new Date(),
        comments: comments || changeRequest.comments
      });
      
      await logAuditAction(
        req.user!.id,
        "approve_business_review",
        "change_request",
        id.toString(),
        `Approved business review for change request ID: ${id}`
      );
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to process business approval" });
    }
  });

  // Schedule approved change
  app.put("/api/change-requests/:id/schedule", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { scheduledFor } = req.body;
      const changeRequest = await storage.getChangeRequest(id);
      
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      if (changeRequest.status !== "approved") {
        return res.status(400).json({ message: "Change request must be approved before scheduling" });
      }
      
      // Only implementers or admins can schedule
      if (req.user!.role !== "admin" && req.user!.role !== "implementer") {
        return res.status(403).json({ message: "Not authorized to schedule this change request" });
      }
      
      const updatedRequest = await storage.updateChangeRequest(id, {
        status: "scheduled",
        scheduledFor: new Date(scheduledFor),
        assignedTo: req.user!.id
      });
      
      await logAuditAction(
        req.user!.id,
        "schedule_change_request",
        "change_request",
        id.toString(),
        `Scheduled change request ID: ${id} for ${scheduledFor}`
      );
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to schedule change request" });
    }
  });

  // Implement change request
  app.put("/api/change-requests/:id/implement", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { implementationNotes } = req.body;
      const changeRequest = await storage.getChangeRequest(id);
      
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      if (changeRequest.status !== "scheduled" && changeRequest.status !== "approved") {
        return res.status(400).json({ message: "Change request must be approved or scheduled before implementation" });
      }
      
      // Only certain roles can implement change requests
      if (req.user!.role !== "admin" && req.user!.role !== "implementer") {
        return res.status(403).json({ message: "Not authorized to implement change requests" });
      }
      
      // For firewall changes, implementer must be a network admin
      if (changeRequest.type === "firewall" && req.user!.role !== "admin" && req.user!.role !== "network_admin") {
        return res.status(403).json({ message: "Only network admins can implement firewall changes" });
      }
      
      const updatedRequest = await storage.updateChangeRequest(id, {
        status: "implemented",
        implementerId: req.user!.id,
        implementedAt: new Date(),
        implementationNotes: implementationNotes || null
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
  
  // Verify implementation (controller)
  app.put("/api/change-requests/:id/verify", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { verified, verificationNotes } = req.body;
      const changeRequest = await storage.getChangeRequest(id);
      
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      if (changeRequest.status !== "implemented") {
        return res.status(400).json({ message: "Change request must be implemented before verification" });
      }
      
      // Only auditor or admin roles can verify changes (controller)
      if (req.user!.role !== "admin" && req.user!.role !== "auditor") {
        return res.status(403).json({ message: "Not authorized to verify change requests" });
      }
      
      // Verifier should not be the same as the implementer
      if (changeRequest.implementerId === req.user!.id) {
        return res.status(403).json({ message: "Change request must be verified by someone other than the implementer" });
      }
      
      let newStatus = "closed";
      let verificationStatus = "verified";
      
      if (!verified) {
        newStatus = "implemented"; // Keep as implemented if verification fails
        verificationStatus = "failed";
      }
      
      const updatedRequest = await storage.updateChangeRequest(id, {
        status: newStatus,
        verificationStatus,
        verifierId: req.user!.id,
        verifiedAt: new Date(),
        verificationNotes: verificationNotes || null,
        closedAt: verified ? new Date() : null
      });
      
      await logAuditAction(
        req.user!.id,
        verified ? "verify_change_request" : "reject_verification",
        "change_request",
        id.toString(),
        `${verified ? "Verified" : "Failed verification for"} change request ID: ${id}`
      );
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to verify change request" });
    }
  });

  // Change request device relationship API
  app.get("/api/change-requests/:id/devices", isAuthenticated, async (req, res) => {
    try {
      const changeRequestId = parseInt(req.params.id);
      const changeRequest = await storage.getChangeRequest(changeRequestId);
      
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      const devices = await storage.getDevicesForChangeRequest(changeRequestId);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching devices for change request:", error);
      res.status(500).json({ message: "Failed to fetch devices for change request" });
    }
  });
  
  app.post("/api/change-requests/:id/devices", isAuthenticated, async (req, res) => {
    try {
      const changeRequestId = parseInt(req.params.id);
      const { deviceId, impact, notes } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ message: "Device ID is required" });
      }
      
      const changeRequest = await storage.getChangeRequest(changeRequestId);
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      const device = await storage.getDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      // Check if change request is in editable state
      const editableStates = ['draft', 'pending_approval'];
      if (!editableStates.includes(changeRequest.status)) {
        return res.status(400).json({ 
          message: "Cannot modify devices for change requests that are already approved or implemented" 
        });
      }
      
      // Check if user is authorized
      if (req.user!.id !== changeRequest.requestedBy && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to modify this change request" });
      }
      
      const relationship = await storage.addDeviceToChangeRequest({
        changeRequestId,
        deviceId,
        impact: impact || 'affected',
        notes
      });
      
      await logAuditAction(
        req.user!.id,
        "add_device_to_change_request",
        "change_request_device",
        `${changeRequestId}-${deviceId}`,
        `Added device ${device.name} to change request ID: ${changeRequestId}`
      );
      
      res.status(201).json(relationship);
    } catch (error) {
      console.error("Error adding device to change request:", error);
      res.status(500).json({ message: "Failed to add device to change request" });
    }
  });
  
  app.delete("/api/change-requests/:changeRequestId/devices/:deviceId", isAuthenticated, async (req, res) => {
    try {
      const changeRequestId = parseInt(req.params.changeRequestId);
      const deviceId = parseInt(req.params.deviceId);
      
      const changeRequest = await storage.getChangeRequest(changeRequestId);
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      
      // Check if change request is in editable state
      const editableStates = ['draft', 'pending_approval'];
      if (!editableStates.includes(changeRequest.status)) {
        return res.status(400).json({ 
          message: "Cannot modify devices for change requests that are already approved or implemented" 
        });
      }
      
      // Check if user is authorized
      if (req.user!.id !== changeRequest.requestedBy && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to modify this change request" });
      }
      
      const device = await storage.getDevice(deviceId);
      
      await storage.removeDeviceFromChangeRequest(changeRequestId, deviceId);
      
      await logAuditAction(
        req.user!.id,
        "remove_device_from_change_request",
        "change_request_device",
        `${changeRequestId}-${deviceId}`,
        `Removed device ${device?.name || deviceId} from change request ID: ${changeRequestId}`
      );
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing device from change request:", error);
      res.status(500).json({ message: "Failed to remove device from change request" });
    }
  });
  
  app.get("/api/devices/:id/change-requests", isAuthenticated, async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      
      const device = await storage.getDevice(deviceId);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      const changeRequests = await storage.getChangeRequestsForDevice(deviceId);
      res.json(changeRequests);
    } catch (error) {
      console.error("Error fetching change requests for device:", error);
      res.status(500).json({ message: "Failed to fetch change requests for device" });
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
