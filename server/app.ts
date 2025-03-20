import express from "express";
import cors from "cors";
import { attachAuditLogger } from "../shared/utils/audit";
import { IStorage, storage } from "./storage";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Attach storage to request
app.use((req: any, _, next) => {
  req.storage = storage;
  next();
});

// Attach audit logger
app.use(attachAuditLogger);

declare global {
  namespace Express {
    interface Request {
      storage: IStorage;
    }
  }
}

export default app; 