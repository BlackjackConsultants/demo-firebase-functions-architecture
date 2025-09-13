# Create an angular application that uses firebase functions.  Make the functions use rest API   separate the rest routes by files

Awesome—let’s set up an Angular app that talks to Firebase **Cloud Functions** via a clean, modular **REST API** (Express routers split by file). I’ll give you a ready-to-copy structure, code snippets, and local emulator + prod deployment steps.

# 1) Create the workspace

```bash
# Angular app
ng new ng-firebase-rest --routing --style=scss --standalone
cd ng-firebase-rest

# Firebase in the same folder (Functions in TypeScript)
npm i -g firebase-tools
firebase login
firebase init

# Choose: Functions, Emulators, (optionally) Hosting
# - Functions language: TypeScript
# - ESLint: yes
# - Use existing or create new project
# - Emulators: Functions, Hosting (optional), Firestore (optional)
# - Set emulator ports as prompted
```

> If you also selected Hosting, we’ll add a rewrite so `/api/*` routes hit the function.

---

# 2) Functions project layout (modular routers)

```
functions/
  package.json
  tsconfig.json
  src/
    index.ts
    app.ts
    middlewares/
      cors.ts
      auth.ts
      error.ts
    routes/
      health.ts
      users.ts
      posts.ts
    services/
      users.service.ts
      posts.service.ts
    types/
      dto.ts
```

## `functions/package.json`

```json
{
  "name": "functions",
  "engines": { "node": "20" },
  "scripts": {
    "build": "tsc",
    "serve": "firebase emulators:start",
    "shell": "firebase functions:shell",
    "start": "npm run serve",
    "deploy": "firebase deploy --only functions",
    "lint": "eslint ."
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.6.0",
    "firebase-functions": "^6.0.0",
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "typescript": "^5.6.2",
    "eslint": "^9.11.1",
    "@types/cors": "^2.8.17"
  },
  "private": true
}
```

## `functions/tsconfig.json`

```json
{
  "compilerOptions": {
    "lib": ["es2022"],
    "module": "commonjs",
    "target": "es2022",
    "outDir": "lib",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

---

# 3) Express app + middlewares

## `functions/src/middlewares/cors.ts`

```ts
import cors from "cors";
export const corsMiddleware = cors({ origin: true });
```

## `functions/src/middlewares/error.ts`

```ts
import { Request, Response, NextFunction } from "express";

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
}
```

## (Optional) Auth middleware example (e.g., Firebase Auth Bearer)

`functions/src/middlewares/auth.ts`

```ts
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
```

---

# 4) Routes split by file

## `functions/src/routes/health.ts`

```ts
import { Router } from "express";
export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ ok: true, service: "api", ts: new Date().toISOString() });
});
```

## `functions/src/services/users.service.ts`

```ts
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
```

## `functions/src/types/dto.ts`

```ts
import { z } from "zod";

export const CreateUserDto = z.object({
  email: z.string().email(),
  name: z.string().min(1)
});
export const UpdateUserDto = CreateUserDto.partial();

export type CreateUserDto = z.infer<typeof CreateUserDto>;
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
```

## `functions/src/routes/users.ts`

```ts
import { Router } from "express";
import { UsersService } from "../services/users.service";
import { CreateUserDto, UpdateUserDto } from "../types/dto";

export const usersRouter = Router();

usersRouter.get("/", (_req, res) => {
  res.json(UsersService.list());
});

usersRouter.get("/:id", (req, res) => {
  const user = UsersService.get(req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

usersRouter.post("/", (req, res, next) => {
  try {
    const parsed = CreateUserDto.parse(req.body);
    const created = UsersService.create(parsed);
    res.status(201).json(created);
  } catch (e) { next(e); }
});

usersRouter.patch("/:id", (req, res, next) => {
  try {
    const parsed = UpdateUserDto.parse(req.body);
    const updated = UsersService.update(req.params.id, parsed);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) { next(e); }
});

usersRouter.delete("/:id", (req, res) => {
  const ok = UsersService.remove(req.params.id);
  res.status(ok ? 204 : 404).end();
});
```

## `functions/src/services/posts.service.ts`

```ts
export type Post = { id: string; userId: string; title: string; body: string };
const posts: Record<string, Post> = {};

export const PostsService = {
  list(): Post[] { return Object.values(posts); }
};
```

## `functions/src/routes/posts.ts`

```ts
import { Router } from "express";
import { PostsService } from "../services/posts.service";

export const postsRouter = Router();

postsRouter.get("/", (_req, res) => {
  res.json(PostsService.list());
});
```

---

# 5) Wire up the Express app and export the HTTP function

## `functions/src/app.ts`

```ts
import * as admin from "firebase-admin";
import express from "express";
import { corsMiddleware } from "./middlewares/cors";
import { errorMiddleware } from "./middlewares/error";
import { healthRouter } from "./routes/health";
import { usersRouter } from "./routes/users";
import { postsRouter } from "./routes/posts";
// import { verifyAuth } from "./middlewares/auth"; // if you want protected routes

// Initialize Admin once
try { admin.app(); } catch { admin.initializeApp(); }

export function createApp() {
  const app = express();

  // Core middlewares
  app.use(corsMiddleware);
  app.use(express.json());

  // Routes (versioned)
  app.use("/v1/health", healthRouter);
  app.use("/v1/users", usersRouter); // app.use("/v1/users", verifyAuth, usersRouter) to protect
  app.use("/v1/posts", postsRouter);

  // Fallback / error
  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
  app.use(errorMiddleware);

  return app;
}
```

## `functions/src/index.ts`

```ts
import * as functions from "firebase-functions";
import { createApp } from "./app";

// Choose region as needed
const region = "us-central1";

export const api = functions
  .region(region)
  .https.onRequest(createApp());
```

This deploys one HTTPS function named `api` that hosts your whole Express REST API at:

```
https://us-central1-<PROJECT_ID>.cloudfunctions.net/api/
```

Endpoints:

* `GET /v1/health`
* `GET /v1/users`
* `POST /v1/users`
* …

---

# 6) Emulator & Hosting rewrites

## `firebase.json` (top-level)

```json
{
  "functions": {
    "source": "functions"
  },
  "hosting": {
    "public": "dist/ng-firebase-rest/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/api/**", "function": "api" },     // <-- REST via /api/*
      { "source": "**", "destination": "/index.html"} // Angular SPA
    ]
  },
  "emulators": {
    "functions": { "port": 5001 },
    "hosting": { "port": 5000 }
  }
}
```

Local emulator REST base URL:

```
http://127.0.0.1:5001/<PROJECT_ID>/us-central1/api
```

With Hosting rewrite you can also call:

```
http://127.0.0.1:5000/api
```

---

# 7) Angular: environment + service + sample component

## `src/environments/environment.ts`

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://127.0.0.1:5000/api' // via Hosting emulator rewrite
};
```

## `src/environments/environment.production.ts`

```ts
export const environment = {
  production: true,
  // Replace <PROJECT_ID> and region if needed
  apiBaseUrl: 'https://us-central1-<PROJECT_ID>.cloudfunctions.net/api'
};
```

## Minimal API client (standalone)

`src/app/services/api.service.ts`

```ts
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface User { id: string; email: string; name: string; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  readonly base = environment.apiBaseUrl;

  listUsers() { return this.http.get<User[]>(`${this.base}/v1/users`); }
  createUser(data: Omit<User, 'id'>) { return this.http.post<User>(`${this.base}/v1/users`, data); }
  health() { return this.http.get<{ ok: boolean }>(`${this.base}/v1/health`); }
}
```

## App config: import HttpClient

`src/app/app.config.ts` (if not already present)

```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

## Example component

`src/app/features/users/users.component.ts`

```ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, User } from '../../services/api.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Users</h2>
    <form (submit)="addUser($event)">
      <input name="name" placeholder="Name" required />
      <input name="email" placeholder="Email" required />
      <button>Add</button>
    </form>

    <ul>
      <li *ngFor="let u of users()">{{u.name}} — {{u.email}}</li>
    </ul>
  `
})
export class UsersComponent {
  private api = inject(ApiService);
  users = signal<User[]>([]);

  ngOnInit() {
    this.api.listUsers().subscribe(u => this.users.set(u));
  }
  addUser(ev: Event) {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    this.api.createUser({ name, email }).subscribe(created => {
      this.users.update(arr => [created, ...arr]);
      form.reset();
    });
  }
}
```

Add a route:
`src/app/app.routes.ts`

```ts
import { Routes } from '@angular/router';
import { UsersComponent } from './features/users/users.component';

export const routes: Routes = [
  { path: '', component: UsersComponent }
];
```

---

# 8) Try it locally

```bash
# 1) Build Angular
ng build --configuration development

# 2) Start emulators
cd functions
npm run serve
```

Test REST with curl:

```bash
curl http://127.0.0.1:5000/api/v1/health
curl -X POST http://127.0.0.1:5000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace", "email":"ada@example.com"}'
curl http://127.0.0.1:5000/api/v1/users
```

---

# 9) Deploy

```bash
# From project root
npm run build --prefix functions
firebase deploy --only functions
# (If using hosting too)
ng build --configuration production
firebase deploy --only hosting,functions
```

Prod base URL:

```
https://us-central1-<PROJECT_ID>.cloudfunctions.net/api
```

---

## Notes & options

* **Auth**: Uncomment `verifyAuth` on the routes you want protected, pass Firebase ID token from Angular as `Authorization: Bearer <token>`.
* **Versioning**: You can increment `/v1` to `/v2` on breaking changes while keeping both live in `app.ts`.
* **Data**: Replace in-memory services with Firestore/Admin SDK as needed.
* **Cold starts**: Keep a single `api` function bundling routes; region selection close to your users reduces latency.

If you want, I can adapt this to your exact Angular version, add Firestore CRUD, or wire in guards/interceptors that attach ID tokens automatically.
