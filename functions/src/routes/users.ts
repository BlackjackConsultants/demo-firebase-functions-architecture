import { Router } from "express";
import { UsersService } from "../services/users.service";
import { CreateUserDto, UpdateUserDto } from "../types/dto";

export const usersRouter = Router();

/**
 * Get all users
 * http://127.0.0.1:5001/demo-app/us-central1/api/v1/users
 */
usersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await UsersService.list();
    return res.json(users);
  } catch (e) { return next(e); }
});

/**
 * Get user by ID
 * http://127.0.0.1:5001/demo-app/us-central1/api/v1/users/rnRZf28bwR750ZciEhyK
 */
usersRouter.get("/:id", async (req, res, next) => {
  try {
    const user = await UsersService.get(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.json(user);
  } catch (e) { return next(e); }
});
  // Added return to satisfy TypeScript

// POST /v1/users
// - Emulator Hosting:  POST http://localhost:5000/api/v1/users
// - Emulator Function: POST http://localhost:5001/<projectId>/us-central1/api/v1/users
// - Production:        POST https://<your-site>.web.app/api/v1/users
usersRouter.post("/", async (req, res, next) => {
  try {
    const parsed = CreateUserDto.parse(req.body);
    const created = await UsersService.create(parsed);
    return res.status(201).json(created);
  } catch (e) { return next(e); }
});
  // Added return to satisfy TypeScript

// PATCH /v1/users/:id
// - Emulator Hosting:  PATCH http://localhost:5000/api/v1/users/:id
// - Emulator Function: PATCH http://localhost:5001/<projectId>/us-central1/api/v1/users/:id
// - Production:        PATCH https://<your-site>.web.app/api/v1/users/:id
usersRouter.patch("/:id", async (req, res, next) => {
  try {
    const parsed = UpdateUserDto.parse(req.body);
    const updated = await UsersService.update(req.params.id, parsed);
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (e) { return next(e); }
});
  // Added return to satisfy TypeScript

// DELETE /v1/users/:id
// - Emulator Hosting:  DELETE http://localhost:5000/api/v1/users/:id
// - Emulator Function: DELETE http://localhost:5001/<projectId>/us-central1/api/v1/users/:id
// - Production:        DELETE https://<your-site>.web.app/api/v1/users/:id
usersRouter.delete("/:id", async (req, res, next) => {
  try {
    const ok = await UsersService.remove(req.params.id);
    return res.status(ok ? 204 : 404).end();
  } catch (e) { return next(e); }
});
  // Added return to satisfy TypeScript
