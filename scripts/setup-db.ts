import { pool, db } from '../server/db';
import { sql } from 'drizzle-orm';

console.log('Setting up database schema...');

async function setupDatabase() {
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        avatar TEXT
      );
    `);
    console.log('Created users table');

    // Create compliance_frameworks table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS compliance_frameworks (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );
    `);
    console.log('Created compliance_frameworks table');

    // Create compliance_controls table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS compliance_controls (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT,
        framework_id INTEGER NOT NULL REFERENCES compliance_frameworks(id),
        severity TEXT NOT NULL,
        due_date TIMESTAMP,
        assigned_to INTEGER REFERENCES users(id),
        last_checked TIMESTAMP
      );
    `);
    console.log('Created compliance_controls table');

    // Create evidence table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS evidence (
        id SERIAL PRIMARY KEY,
        description TEXT,
        control_id INTEGER NOT NULL REFERENCES compliance_controls(id),
        file_path TEXT,
        uploaded_by INTEGER NOT NULL REFERENCES users(id),
        uploaded_at TIMESTAMP NOT NULL
      );
    `);
    console.log('Created evidence table');

    // Create sites table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sites (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        location TEXT
      );
    `);
    console.log('Created sites table');

    // Create devices table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        site_id INTEGER NOT NULL REFERENCES sites(id),
        ip_address TEXT,
        vlan TEXT,
        operating_system TEXT,
        services TEXT
      );
    `);
    console.log('Created devices table');

    // Create change_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS change_requests (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        requested_by INTEGER NOT NULL REFERENCES users(id),
        approver_id INTEGER REFERENCES users(id),
        implementer_id INTEGER REFERENCES users(id),
        requested_at TIMESTAMP NOT NULL,
        approved_at TIMESTAMP,
        implemented_at TIMESTAMP
      );
    `);
    console.log('Created change_requests table');

    // Create sprints table (needs to be before tasks which references it)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sprints (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        status TEXT NOT NULL
      );
    `);
    console.log('Created sprints table');

    // Create tasks table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        due_date TIMESTAMP,
        assigned_to INTEGER REFERENCES users(id),
        related_control_id INTEGER REFERENCES compliance_controls(id),
        sprint_id INTEGER REFERENCES sprints(id)
      );
    `);
    console.log('Created tasks table');

    // Create audit_logs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        details TEXT,
        timestamp TIMESTAMP NOT NULL
      );
    `);
    console.log('Created audit_logs table');

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();