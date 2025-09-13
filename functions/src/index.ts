import * as functions from "firebase-functions";
import { createApp } from "./app";

// Choose region as needed
const region = "us-central1";

export const api = functions
  .region(region)
  .https.onRequest(createApp());
