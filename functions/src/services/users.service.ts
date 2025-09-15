import { firestore } from "../db";

export type User = { id: string; email: string; name: string };

const collection = firestore.collection("users");

export const UsersService = {
  async list(): Promise<User[]> {
    const snap = await collection.get();
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<User, "id">) }));
  },
  async get(id: string): Promise<User | undefined> {
    const doc = await collection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...(doc.data() as Omit<User, "id">) };
  },
  async create(data: Omit<User, "id">): Promise<User> {
    const ref = await collection.add(data);
    const doc = await ref.get();
    return { id: doc.id, ...(doc.data() as Omit<User, "id">) };
  },
  async update(id: string, data: Partial<Omit<User, "id">>): Promise<User | undefined> {
    const ref = collection.doc(id);
    const exists = await ref.get();
    if (!exists.exists) return undefined;
    await ref.set(data, { merge: true });
    const updated = await ref.get();
    return { id: updated.id, ...(updated.data() as Omit<User, "id">) };
  },
  async remove(id: string): Promise<boolean> {
    const ref = collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }
};
