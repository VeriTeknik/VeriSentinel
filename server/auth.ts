import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Check if stored password has the correct format (hash.salt)
  if (!stored.includes(".")) {
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  
  // Ensure both buffers have the same length
  if (hashedBuf.length !== suppliedBuf.length) {
    return false;
  }
  
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "verisentinel-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Create audit log for user registration
      await storage.createAuditLog({
        action: "user_registered",
        userId: user.id,
        resourceType: "user",
        resourceId: user.id.toString(),
        details: `User ${user.username} registered`
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password, ...userResponse } = user;
        
        res.status(201).json(userResponse);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Create audit log for login
    if (req.user) {
      storage.createAuditLog({
        action: "user_login",
        userId: req.user.id,
        resourceType: "user",
        resourceId: req.user.id.toString(),
        details: `User ${req.user.username} logged in`
      });
      
      // Remove password from response
      const { password, ...userResponse } = req.user;
      
      res.status(200).json(userResponse);
    } else {
      res.status(401).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    // Create audit log for logout
    if (req.user) {
      storage.createAuditLog({
        action: "user_logout",
        userId: req.user.id,
        resourceType: "user",
        resourceId: req.user.id.toString(),
        details: `User ${req.user.username} logged out`
      });
    }
    
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from response
    const { password, ...userResponse } = req.user;
    
    res.json(userResponse);
  });
  
  app.get("/api/users", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check if user has management role
    const managementRoles = ["admin", "ciso", "cto", "security_manager", "network_engineer"];
    if (!managementRoles.includes(req.user.role)) {
      return res.status(403).send("Unauthorized access");
    }
    
    storage.listUsers()
      .then(users => {
        // Remove passwords from response
        const sanitizedUsers = users.map(user => {
          const { password, ...sanitizedUser } = user;
          return sanitizedUser;
        });
        
        res.json(sanitizedUsers);
      })
      .catch(next);
  });
}
