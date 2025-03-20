import { Request, Response, NextFunction } from "express";
import { AuditLog, SeverityLevel } from "../types/audit-logs";
import { IStorage } from "../../server/storage";

declare global {
  namespace Express {
    interface Request {
      storage: IStorage;
    }
  }
}

interface AuditLogOptions {
  severity?: SeverityLevel;
  action?: string;
  resource?: string;
  complianceStandards?: string[];
}

export class AuditLogger {
  private req: Request;

  constructor(req: Request) {
    this.req = req;
  }

  /**
   * Log a message with optional severity and options
   * @param message The message to log
   * @param severityOrOptions Severity level (0-7) or options object
   * @param options Additional options when severity is provided
   */
  async log(message: string): Promise<void>;
  async log(message: string, severity: SeverityLevel): Promise<void>;
  async log(message: string, options: AuditLogOptions): Promise<void>;
  async log(message: string, severityOrOptions?: SeverityLevel | AuditLogOptions, options?: AuditLogOptions): Promise<void> {
    let severity: SeverityLevel = 6; // Default to Info
    let finalOptions: AuditLogOptions = {};

    if (typeof severityOrOptions === "number") {
      severity = severityOrOptions;
      finalOptions = options || {};
    } else if (severityOrOptions) {
      finalOptions = severityOrOptions;
      severity = severityOrOptions.severity || severity;
    }

    const auditLog: Omit<AuditLog, "id" | "timestamp"> = {
      severity,
      user: this.req.user?.username || "system",
      action: finalOptions.action || "log",
      resource: finalOptions.resource || "system/audit",
      message,
      complianceStandards: finalOptions.complianceStandards || []
    };

    await this.req.storage.createAuditLog(auditLog);
  }

  // Convenience methods for different severity levels
  async emergency(message: string, options?: AuditLogOptions) {
    return this.log(message, { ...options, severity: 0 });
  }

  async alert(message: string, options?: AuditLogOptions) {
    return this.log(message, { ...options, severity: 1 });
  }

  async critical(message: string, options?: AuditLogOptions) {
    return this.log(message, { ...options, severity: 2 });
  }

  async error(message: string, options?: AuditLogOptions) {
    return this.log(message, { ...options, severity: 3 });
  }

  async warning(message: string, options?: AuditLogOptions) {
    return this.log(message, { ...options, severity: 4 });
  }

  async notice(message: string, options?: AuditLogOptions) {
    return this.log(message, { ...options, severity: 5 });
  }

  async info(message: string, options?: AuditLogOptions) {
    return this.log(message, { ...options, severity: 6 });
  }

  async debug(message: string, options?: AuditLogOptions) {
    return this.log(message, { ...options, severity: 7 });
  }
}

// Express middleware to attach audit logger to request
export function attachAuditLogger(req: Request, _: Response, next: NextFunction) {
  req.audit = new AuditLogger(req);
  next();
}

// Extend Express Request type to include audit logger
declare global {
  namespace Express {
    interface Request {
      audit: AuditLogger;
    }
  }
} 