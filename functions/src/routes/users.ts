import { Router } from "express";
import { UsersService } from "../services/users.service";
import { CreateUserDto, UpdateUserDto } from "../types/dto";

export const usersRouter = Router();

usersRouter.get("/", (_req, res) => {
  return res.json(UsersService.list());
});
  // Added return to satisfy TypeScript

usersRouter.get("/:id", (req, res) => {
  const user = UsersService.get(req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  return res.json(user);
});
  // Added return to satisfy TypeScript

usersRouter.post("/", (req, res, next) => {
  try {
    const parsed = CreateUserDto.parse(req.body);
    const created = UsersService.create(parsed);
    return res.status(201).json(created);
  } catch (e) { return next(e); }
});
  // Added return to satisfy TypeScript

usersRouter.patch("/:id", (req, res, next) => {
  try {
    const parsed = UpdateUserDto.parse(req.body);
    const updated = UsersService.update(req.params.id, parsed);
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (e) { return next(e); }
});
  // Added return to satisfy TypeScript

usersRouter.delete("/:id", (req, res) => {
  const ok = UsersService.remove(req.params.id);
  return res.status(ok ? 204 : 404).end();
});
  // Added return to satisfy TypeScript
