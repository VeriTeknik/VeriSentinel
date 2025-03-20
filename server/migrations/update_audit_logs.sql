-- Update existing audit logs to match new schema
UPDATE audit_logs
SET 
  severity = 6, -- Info level for existing logs
  "user" = COALESCE("user", 'system'),
  action = COALESCE(action, 'unknown'),
  resource = 'unknown',
  message = 'Legacy audit log entry'
WHERE 
  severity IS NULL OR
  "user" IS NULL OR
  action IS NULL OR
  resource IS NULL OR
  message IS NULL; 