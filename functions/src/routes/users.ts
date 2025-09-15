import { Router } from "express";
import { UsersService } from "../services/users.service";
import { CreateUserDto, UpdateUserDto } from "../types/dto";

export const usersRouter = Router();

usersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await UsersService.list();
    return res.json(users);
  } catch (e) { return next(e); }
});
  // Added return to satisfy TypeScript

usersRouter.get("/:id", async (req, res, next) => {
  try {
    const user = await UsersService.get(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.json(user);
  } catch (e) { return next(e); }
});
  // Added return to satisfy TypeScript

usersRouter.post("/", async (req, res, next) => {
  try {
    const parsed = CreateUserDto.parse(req.body);
    const created = await UsersService.create(parsed);
    return res.status(201).json(created);
  } catch (e) { return next(e); }
});
  // Added return to satisfy TypeScript

usersRouter.patch("/:id", async (req, res, next) => {
  try {
    const parsed = UpdateUserDto.parse(req.body);
    const updated = await UsersService.update(req.params.id, parsed);
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (e) { return next(e); }
});
  // Added return to satisfy TypeScript

usersRouter.delete("/:id", async (req, res, next) => {
  try {
    const ok = await UsersService.remove(req.params.id);
    return res.status(ok ? 204 : 404).end();
  } catch (e) { return next(e); }
});
  // Added return to satisfy TypeScript
