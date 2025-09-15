import * as admin from "firebase-admin";

// Ensure singleton initialization (app.ts also does a guard, this is safe)
if (!admin.apps.length) {
  admin.initializeApp();
}

export const firestore = admin.firestore();
