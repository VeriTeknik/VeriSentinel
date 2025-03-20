-- Drop existing audit_logs table
DROP TABLE IF EXISTS audit_logs;

-- Create new audit_logs table with updated schema
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  severity INTEGER NOT NULL,
  "user" TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  message TEXT NOT NULL,
  compliance_standards TEXT[]
); 