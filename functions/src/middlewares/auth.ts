import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";

// Call admin.initializeApp() once (done in app.ts)
export async function verifyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = admin.auth();
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing Authorization header" });
    await auth.verifyIdToken(token);
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
