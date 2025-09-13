export type Post = { id: string; userId: string; title: string; body: string };
const posts: Record<string, Post> = {};

export const PostsService = {
  list(): Post[] { return Object.values(posts); }
};
