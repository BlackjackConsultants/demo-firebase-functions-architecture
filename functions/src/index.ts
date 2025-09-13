import { onRequest } from "firebase-functions/v2/https";
import { createApp } from "./app";

// Choose region as needed
const region = "us-central1";

export const api = onRequest({ region }, createApp());
