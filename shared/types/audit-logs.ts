export type SeverityLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export type ComplianceStandard = "PCI-DSS" | "ISO-27001" | "HIPAA" | "GDPR"

export interface AuditLog {
  id: string
  timestamp: string
  severity: SeverityLevel
  user: string
  action: string
  resource: string
  message: string
  complianceStandards?: ComplianceStandard[]
  metadata?: Record<string, any>
}

