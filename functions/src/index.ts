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