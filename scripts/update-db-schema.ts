import { pool, db } from '../server/db';
import { sql } from 'drizzle-orm';

console.log('Updating database schema to add new fields...');

async function updateDatabaseSchema() {
  try {
    // Adding RACI matrix fields to sites table with role support
    await db.execute(sql`
      ALTER TABLE sites 
      DROP COLUMN IF EXISTS responsible_user_id,
      DROP COLUMN IF EXISTS accountable_user_id,
      DROP COLUMN IF EXISTS consulted_user_ids,
      DROP COLUMN IF EXISTS informed_user_ids,
      ADD COLUMN IF NOT EXISTS responsible_type TEXT NOT NULL DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS responsible_id TEXT NOT NULL DEFAULT '1',
      ADD COLUMN IF NOT EXISTS accountable_type TEXT NOT NULL DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS accountable_id TEXT NOT NULL DEFAULT '1',
      ADD COLUMN IF NOT EXISTS consulted_type TEXT NOT NULL DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS consulted_ids TEXT,
      ADD COLUMN IF NOT EXISTS informed_type TEXT NOT NULL DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS informed_ids TEXT,
      ADD COLUMN IF NOT EXISTS security_level TEXT,
      ADD COLUMN IF NOT EXISTS last_audit_date TIMESTAMP;
    `);
    console.log('Updated sites table with role-based RACI matrix columns');

    // Adding new fields to devices table
    await db.execute(sql`
      ALTER TABLE devices 
      ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS responsibility_type TEXT,
      ADD COLUMN IF NOT EXISTS last_maintenance_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS maintenance_notes TEXT,
      ADD COLUMN IF NOT EXISTS parent_device_id INTEGER REFERENCES devices(id),
      ADD COLUMN IF NOT EXISTS device_role TEXT;
    `);
    console.log('Updated devices table with new columns');

    // Adding RACI fields to change_requests table if not already present
    await db.execute(sql`
      ALTER TABLE change_requests
      ADD COLUMN IF NOT EXISTS type TEXT,
      ADD COLUMN IF NOT EXISTS risk_level TEXT,
      ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id),
      
      ADD COLUMN IF NOT EXISTS technical_approval_status TEXT,
      ADD COLUMN IF NOT EXISTS technical_approver_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS technical_approved_at TIMESTAMP,
      
      ADD COLUMN IF NOT EXISTS security_approval_status TEXT,
      ADD COLUMN IF NOT EXISTS security_approver_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS security_approved_at TIMESTAMP,
      
      ADD COLUMN IF NOT EXISTS business_approval_status TEXT,
      ADD COLUMN IF NOT EXISTS business_approver_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS business_approved_at TIMESTAMP,
      
      ADD COLUMN IF NOT EXISTS implementer_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS implementation_notes TEXT,
      
      ADD COLUMN IF NOT EXISTS verification_status TEXT,
      ADD COLUMN IF NOT EXISTS verifier_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS verification_notes TEXT,
      
      ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP,
      ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP,
      
      ADD COLUMN IF NOT EXISTS affected_systems TEXT,
      ADD COLUMN IF NOT EXISTS backout_plan TEXT,
      ADD COLUMN IF NOT EXISTS related_control_ids INTEGER[],
      ADD COLUMN IF NOT EXISTS comments TEXT,
      
      ADD COLUMN IF NOT EXISTS firewall_rules TEXT,
      ADD COLUMN IF NOT EXISTS source_ip TEXT,
      ADD COLUMN IF NOT EXISTS destination_ip TEXT,
      ADD COLUMN IF NOT EXISTS port_services TEXT,
      ADD COLUMN IF NOT EXISTS action TEXT;
    `);
    console.log('Updated change_requests table with new columns');

    // Create change_request_devices table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS change_request_devices (
        id SERIAL PRIMARY KEY,
        change_request_id INTEGER NOT NULL REFERENCES change_requests(id),
        device_id INTEGER NOT NULL REFERENCES devices(id),
        impact TEXT NOT NULL,
        notes TEXT
      );
    `);
    console.log('Created or verified change_request_devices table');

    // Update tasks table with missing fields
    await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS related_change_request_id INTEGER REFERENCES change_requests(id),
      ADD COLUMN IF NOT EXISTS priority TEXT,
      ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
    `);
    console.log('Updated tasks table with new columns');

    console.log('Database schema update completed successfully.');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

updateDatabaseSchema();