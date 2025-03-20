/**
 * Severity levels for audit logs
 * 0: Emergency - System is unusable
 * 1: Alert - Action must be taken immediately
 * 2: Critical - Critical conditions
 * 3: Error - Error conditions
 * 4: Warning - Warning conditions
 * 5: Notice - Normal but significant condition
 * 6: Info - Informational messages
 * 7: Debug - Debug-level messages
 */
export type SeverityLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export type ComplianceStandard = "PCI-DSS" | "ISO-27001" | "HIPAA" | "GDPR"

export interface AuditLog {
  id: number
  timestamp: Date
  severity: SeverityLevel
  user: string
  action: string
  resource: string
  message: string
  complianceStandards: string[]
  metadata?: Record<string, any>
}

