import { Router } from "express";
import { PostsService } from "../services/posts.service";

export const postsRouter = Router();

postsRouter.get("/", (_req, res) => {
  res.json(PostsService.list());
});
