import { pool, db } from '../server/db';
import { sql } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

console.log('Setting up database schema...');

// Promisify scrypt function for easier usage
const scryptAsync = promisify(scrypt);

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

    // Create other necessary tables...

    // Create default users after tables are set up
    await createDefaultUsers();

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

// Helper function to hash password with salt
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`;
}

// Create default users with unique hashed passwords
async function createDefaultUsers() {
  try {
    // Create hashed passwords with different salts
    const adminHashedPassword = await hashPassword('password123');
    const ckaracaHashedPassword = await hashPassword('password123');
    const engineerHashedPassword = await hashPassword('password123');

    // Insert default users into the users table
    await db.execute(sql`
      INSERT INTO users (username, password, name, email, role, avatar)
      VALUES
        ('admin', ${adminHashedPassword}, 'Administrator', 'admin@example.com', 'admin', NULL),
        ('ckaraca', ${ckaracaHashedPassword}, 'Security Officer', 'ckaraca@example.com', 'security', NULL),
        ('engineer', ${engineerHashedPassword}, 'Network Engineer', 'engineer@example.com', 'engineer', NULL)
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('Default users created successfully!');
  } catch (error) {
    console.error('Error creating default users:', error);
  }
}

// Start the database setup process
setupDatabase();
