export type User = { id: string; email: string; name: string };
const db: Record<string, User> = {};

export const UsersService = {
  list(): User[] {
    return Object.values(db);
  },
  get(id: string): User | undefined {
    return db[id];
  },
  create(data: Omit<User, "id">): User {
    const id = crypto.randomUUID();
    const user = { id, ...data };
    db[id] = user;
    return user;
  },
  update(id: string, data: Partial<Omit<User, "id">>): User | undefined {
    if (!db[id]) return undefined;
    db[id] = { ...db[id], ...data };
    return db[id];
  },
  remove(id: string): boolean {
    if (!db[id]) return false;
    delete db[id];
    return true;
  }
};
