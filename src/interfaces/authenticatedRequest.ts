import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: { id: string } | JwtPayload; // Assuming 'id' comes from JWT
}
