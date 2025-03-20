import { Router } from 'express';
import { storage } from '../storage';
import { withPermission } from '../middleware/permissions';
import { z } from 'zod';
import { insertDeviceSchema } from '@shared/schema';

const router = Router();

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

// List devices
router.get('/', withPermission('view_devices'), async (req, res) => {
  try {
    const siteId = req.query.siteId ? parseInt(req.query.siteId as string) : undefined;
    const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
    const topLevelOnly = req.query.topLevelOnly === 'true';
    
    let devices;
    if (parentId) {
      devices = await storage.listDeviceChildren(parentId);
    } else if (siteId && topLevelOnly) {
      devices = await storage.listTopLevelDevices(siteId);
    } else {
      devices = await storage.listDevices(siteId);
    }
    
    res.json(devices);
  } catch (error) {
    console.error('Error in GET /devices:', error);
    res.status(500).json({ message: "Failed to retrieve devices", error: String(error) });
  }
});

// Get single device
router.get('/:id', withPermission('view_devices'), async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    const device = await storage.getDevice(deviceId);
    
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    
    res.json(device);
  } catch (error) {
    console.error('Error in GET /devices/:id:', error);
    res.status(500).json({ message: "Failed to retrieve device" });
  }
});

// Create device
router.post('/', withPermission('manage_devices'), async (req, res) => {
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
    console.error('Error in POST /devices:', error);
    res.status(500).json({ message: "Failed to create device" });
  }
});

// Update device
router.put('/:id', withPermission('manage_devices'), async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    const device = await storage.getDevice(deviceId);
    
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    
    const validatedData = insertDeviceSchema.partial().parse(req.body);
    const updatedDevice = await storage.updateDevice(deviceId, validatedData);
    
    await logAuditAction(
      req.user!.id,
      "update_device",
      "device",
      deviceId.toString(),
      `Updated device: ${device.name}`
    );
    
    res.json(updatedDevice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error('Error in PUT /devices/:id:', error);
    res.status(500).json({ message: "Failed to update device" });
  }
});

// Delete device
router.delete('/:id', withPermission('manage_devices'), async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    const device = await storage.getDevice(deviceId);
    
    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }
    
    // TODO: Implement device deletion in storage
    await storage.deleteDevice(deviceId);
    
    await logAuditAction(
      req.user!.id,
      "delete_device",
      "device",
      deviceId.toString(),
      `Deleted device: ${device.name}`
    );
    
    res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /devices/:id:', error);
    res.status(500).json({ message: "Failed to delete device" });
  }
});

export default router; 