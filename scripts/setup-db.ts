import { pool, db } from '../server/db';
import { sql } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

console.log('Setting up database schema...');

// Promisify scrypt function for easier usage
const scryptAsync = promisify(scrypt);

// Securely hash password using Scrypt with specific parameters
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex'); // Generate a random salt
  const N = 16384, r = 8, p = 1; // Recommended Scrypt parameters
  const derivedKey = (await scryptAsync(password, salt, 64, { N, r, p })) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`; // Return hashed password with salt
}

// Function to verify hashed password
async function verifyPassword(storedHash: string, inputPassword: string): Promise<boolean> {
  const [hashedPassword, salt] = storedHash.split('.');
  const N = 16384, r = 8, p = 1;
  const derivedKey = (await scryptAsync(inputPassword, salt, 64, { N, r, p })) as Buffer;
  return hashedPassword === derivedKey.toString('hex');
}

async function setupDatabase() {
  try {
    // Create the "users" table if it does not exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'security', 'engineer')),
        avatar TEXT
      );
    `);
    console.log('Created users table');

    // Create default users after tables are set up
    await createDefaultUsers();

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Close the database connection properly
    await pool.end();
    process.exit(0);
  }
}

// Function to create default users with the same password
async function createDefaultUsers() {
  try {
    // Use environment variable for the default password
    const defaultPassword = process.env.DEFAULT_PASSWORD || 'password123';
    const commonHashedPassword = await hashPassword(defaultPassword);

    // Insert default users into the "users" table
    await db.execute(sql`
      INSERT INTO users (username, password, name, email, role, avatar)
      VALUES
        ('admin', ${commonHashedPassword}, 'Administrator', 'admin@example.com', 'admin', NULL),
        ('ckaraca', ${commonHashedPassword}, 'Security Officer', 'ckaraca@example.com', 'security', NULL),
        ('engineer', ${commonHashedPassword}, 'Network Engineer', 'engineer@example.com', 'engineer', NULL)
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('Default users created successfully!');
  } catch (error) {
    console.error('Error creating default users:', error);
  }
}

// Start the database setup process
setupDatabase();
