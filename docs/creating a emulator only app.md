# Creating an emulator only App

Yes—totally doable. You can build an app that **only** talks to the Firebase **Local Emulator Suite** (Auth/Firestore/Functions/etc.) and will **refuse to run** if it’s not on localhost. Below is a minimal but complete example using **Angular (standalone)** + **Firebase Functions (v2)**, with step-by-step setup and guardrails so it can’t accidentally hit real Firebase.

---

# 0) What you’ll end up with

* **No real Firebase project needed.** We’ll use a fake `projectId` (e.g., `demo-app`) that only exists locally.
* Angular app connects to **Auth**, **Firestore**, and **Functions** **emulators**.
* A couple of Functions (one HTTPS REST, one Callable).
* **Runtime kill-switch**: If the app isn’t on `localhost/127.0.0.1`, it throws and won’t run.
* No Hosting config (so `firebase deploy` does nothing). An optional predeploy script blocks deploys.

---

# 1) Create folders and install tools

```bash
# workspace
mkdir emulator-only-firebase && cd emulator-only-firebase

# Angular app
npm create @angular@latest my-emulator-app -- --standalone
cd my-emulator-app

# AngularFire + Firebase JS SDK
npm i @angular/fire firebase

# (in another terminal, from the workspace root)
npm i -g firebase-tools
```

---

# 2) Initialize only Emulators + Functions (no hosting)

From **the workspace root** (one level above the Angular app) or inside it—your choice—run:
> When asked for a project: make sure to select "dont set up a default"

```bash
firebase init emulators
# When asked for a project, pick "Don't set up a default
# project" (or skip),
# then we’ll run with --project demo-app locally.
# choose: Auth, Firestore, Functions, Emulator UI
# Ports (suggested):
#   Auth: 9099, Firestore: 8080, Functions: 5001, UI: 4000

firebase init functions
# TypeScript, ESLint (yes/no your call), Node 20
# When asked for a project, pick "Don't set up a default project" (or skip),
# then we’ll run with --project demo-app locally.

firebase init hosting
# When asked for a project: “Don’t set up a default project”
# Public directory: dist/my-emulator-app/browser   ← (verify your Angular outputPath)
# Configure as a single-page app (rewrite all urls to /index.html)? Yes
```

This produces a `firebase.json`, `.firebaserc`, and a `functions/` folder.
If `.firebaserc` was created, edit it to point to a **nonexistent** project id:

```json
{
  "projects": { "default": "demo-app" }
}
```

> Using `demo-app` ensures CLI runs emulators without a real project.

---

# 3) Write local-only Cloud Functions (v2)

**functions/src/index.ts**

```ts
import { onRequest, onCall } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";

// Simple REST endpoint: GET or POST
export const sum = onRequest({ region: "us-central1", cors: true }, (req, res) => {
  const source = req.method === "GET" ? req.query : req.body;
  const a = Number(source.a), b = Number(source.b);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    res.status(400).json({ error: "Provide numeric a & b" });
    return;
  }
  res.json({ sum: a + b, now: new Date().toISOString() });
});

// Simple callable
export const hello = onCall({ region: "us-central1" }, (req) => {
  const name = (req.data?.name ?? "world") as string;
  logger.info("hello called with", { name });
  return { message: `Hello ${name}` };
});
```

**firebase.json** (focus on emulators + functions only)

```json
{
  "functions": { "source": "functions" },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080, "rules": "firestore.rules" },
    "functions": { "port": 5001 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

**firestore.rules** (only for emulator; permissive for dev)

```
// Only used locally in emulator:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{doc=**} { allow read, write: if true; }
  }
}
```

**functions/package.json** (key bits)

```json
{
  "engines": { "node": "20" },
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "firebase emulators:start --project demo-app",
    "start": "npm run build && npm run serve"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

> Versions are examples; newer is fine.

Build then start emulators in one terminal:

```bash
cd functions
npm run start
# Emulator UI at http://localhost:4000
# Functions base: http://127.0.0.1:5001/demo-app/us-central1
```

---

# 4) Wire Angular to **only** talk to emulators

**src/environments/environment.ts** (fake config; works with emulators)

```ts
export const environment = {
  production: false,
  emulatorOnly: true,
  firebase: {
    apiKey: "fake-api-key",
    authDomain: "demo.firebaseapp.com",
    projectId: "demo-app",
    appId: "1:123:web:abc"
  }
};
```

**src/app/app.config.ts** (standalone providers + emulator connects + kill switch)

```ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { provideFunctions, getFunctions, connectFunctionsEmulator } from '@angular/fire/functions';

import { environment } from '../environments/environment';

const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);

if (!isLocalHost) {
  // Hard stop: this app must only run against emulators.
  throw new Error('This application only runs on localhost against Firebase Emulators.');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    provideAuth(() => {
      const auth = getAuth();
      // http, not https, for emulator; disableWarnings suppresses the console warning.
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      return auth;
    }),

    provideFirestore(() => {
      const db = getFirestore();
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      return db;
    }),

    provideFunctions(() => {
      const fn = getFunctions(undefined, 'us-central1');
      connectFunctionsEmulator(fn, '127.0.0.1', 5001);
      return fn;
    }),
  ],
};
```

**src/app/api.service.ts** (call REST + callable)

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private fns = inject(Functions);

  private base = 'http://127.0.0.1:5001/demo-app/us-central1';

  sum(a: number, b: number) {
    return firstValueFrom(this.http.post<{ sum: number }>(`${this.base}/sum`, { a, b }));
  }

  async hello(name: string) {
    const callable = httpsCallable<{ name: string }, { message: string }>(this.fns, 'hello');
    return (await callable({ name })).data.message;
  }
}
```

**src/app/app.component.ts** (tiny demo UI)

```ts
import { Component, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Emulator-only Firebase App</h1>

    <div>
      <label>A: <input type="number" [(ngModel)]="a" /></label>
      <label>B: <input type="number" [(ngModel)]="b" /></label>
      <button (click)="doSum()">Sum (REST)</button>
      <div *ngIf="sumResult() !== null">Result: {{ sumResult() }}</div>
    </div>

    <div class="mt">
      <label>Name: <input [(ngModel)]="name" /></label>
      <button (click)="callHello()">Hello (Callable)</button>
      <div *ngIf="helloMsg()">{{ helloMsg() }}</div>
    </div>
  `,
  styles: [`.mt{ margin-top:1rem } label{margin-right:.6rem}`]
})
export class AppComponent {
  private api = inject(ApiService);
  a = 1; b = 2; name = 'Jorge';
  sumResult = signal<number | null>(null);
  helloMsg = signal<string>('');

  async doSum() {
    const r = await this.api.sum(this.a, this.b);
    this.sumResult.set(r.sum);
  }
  async callHello() {
    this.helloMsg.set(await this.api.hello(this.name));
  }
}
```

**src/main.ts**

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
```

---

# 5) Run everything

In one terminal (from the **functions** folder):

```bash
npm run start
# Emulators + Functions up. UI at http://localhost:4000
```

In another terminal (from the Angular app folder):

```bash
ng serve
# http://localhost:4200
```

Try it out:

* Click **Sum (REST)** → calls `POST /sum`.
* Click **Hello (Callable)** → calls `hello` callable.

You can also curl the REST function:

```bash
curl -X POST http://127.0.0.1:5001/demo-app/us-central1/sum \
  -H "Content-Type: application/json" \
  -d '{"a":5,"b":7}'
```

---

# 6) Make it impossible to “accidentally go prod”

* **No hosting configured** in `firebase.json`.
* **Fake projectId** (`demo-app`). `firebase deploy` will fail because the project doesn’t exist.
* **Runtime guard** in `app.config.ts` throws if not on `localhost/127.0.0.1`.
* Optional: add a protective script in the repo root `package.json`:

```json
{
  "scripts": {
    "predeploy": "echo \"🚫 Deploy is disabled for this repo.\" && exit 1"
  }
}
```

---

# 7) Notes & tips

* You can add more emulators (Storage, Pub/Sub) the same way.
* If you want to run the Angular app on another dev box on your LAN, extend the guard to allow your dev hostname/IP and update emulator URLs accordingly.
* The Firebase JS SDK requires some config fields (like `apiKey`), even for emulators—using **fake values** is fine because every service is pointed at your local emulators.

---

If you want, I can package this into a single zip with the files laid out exactly as above (or adapt it to your current Angular 19/20 repo structure).


## If you get error: Project ID is taken or unavailable. Try fir-firebase-functs-leee4.
That message is from trying to **create a real Firebase project** whose **Project ID** is already taken. You only see it during `firebase init` (or in the Firebase console) — **not** from `npm create @angular`.

Because you want an **emulator-only** app, you don’t need to create any real Firebase project at all. Do this instead:

## Quick fix (emulator-only, no real project)

1. If you already started `firebase init` and it asked for a project, choose:
   **“Don’t set up a default project”** (there’s an option for this in the list).

2. Make sure your `.firebaserc` uses a fake ID:

```json
{
  "projects": { "default": "demo-app" }
}
```

3. Start the emulators with a fake ID (no need for it to exist):

```bash
firebase emulators:start --project demo-app
```

4. In your Angular app, keep the `projectId` as `demo-app` and point all SDKs to the emulators (as in my earlier example). The Functions emulator URL will be:

```
http://127.0.0.1:5001/demo-app/us-central1/<your-function>
```

That’s it — you’ll never hit production and you’ll never need to pick a unique Project ID.

---

## If you actually want to create a real project (optional)

Pick a globally unique Project ID that matches the rules (lowercase letters, numbers, hyphens; usually 6–30 chars; must start with a letter). If the console/CLI says it’s taken, try another (e.g., append a short random suffix). But for your use-case, **skip creating one**.

---

## Why this happens

* `npm create @angular@latest …` just scaffolds Angular — it never touches Firebase.
* The **“Project ID is taken or unavailable”** error appears only when you try to create/select a **real** Firebase project. For emulator-only work, **don’t create or select one**; run everything with a fake ID like `demo-app`.
