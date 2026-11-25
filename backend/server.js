import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { rateLimit } from "express-rate-limit";

const app = express();
const port = Number(process.env.PORT || 8080);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "https://devops-saurabhpandey.github.io";
const adminApiKey = process.env.ADMIN_API_KEY || "";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: frontendOrigin, methods: ["GET", "POST"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "10kb", strict: true }));

const intakeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "बहुत अधिक अनुरोध आए हैं। कृपया कुछ देर बाद प्रयास करें।" }
});

const intakeSchema = new mongoose.Schema({
  kind: { type: String, required: true, enum: ["request", "volunteer"] },
  category: { type: String, required: true, maxlength: 100 },
  location: { type: String, required: true, maxlength: 120 },
  details: { type: String, default: "", maxlength: 1500 },
  consent: { type: Boolean, required: true, validate: value => value === true },
  status: { type: String, enum: ["new", "reviewed", "closed"], default: "new" }
}, { timestamps: true, strict: "throw" });

intakeSchema.index({ createdAt: -1 });
const HelpRequest = mongoose.models.SevaHelpRequest
  || mongoose.model("SevaHelpRequest", intakeSchema, "seva_help_requests");
const Volunteer = mongoose.models.SevaVolunteer
  || mongoose.model("SevaVolunteer", intakeSchema, "seva_volunteers");

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, maxLength);
}

function validateIntake(body, kind) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "अमान्य अनुरोध।" };
  if (body.consent !== true) return { error: "सहमति आवश्यक है।" };
  const category = cleanText(kind === "request" ? body.type : body.interest, 100);
  const location = cleanText(body.location, 120);
  const details = kind === "request" ? cleanText(body.details, 1500) : "";
  if (!category || !location || (kind === "request" && !details)) return { error: "कृपया सभी आवश्यक जानकारी भरें।" };
  return { value: { kind, category, location, details, consent: true } };
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "shivasha-seva-api", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.post("/api/requests", intakeLimiter, async (req, res, next) => {
  try {
    const parsed = validateIntake(req.body, "request");
    if (parsed.error) return res.status(400).json(parsed);
    const saved = await HelpRequest.create(parsed.value);
    res.status(201).json({ success: true, id: saved.id, message: "आपका सहायता अनुरोध समीक्षा के लिए सुरक्षित रूप से दर्ज हुआ।" });
  } catch (error) { next(error); }
});

app.post("/api/volunteers", intakeLimiter, async (req, res, next) => {
  try {
    const parsed = validateIntake(req.body, "volunteer");
    if (parsed.error) return res.status(400).json(parsed);
    const saved = await Volunteer.create(parsed.value);
    res.status(201).json({ success: true, id: saved.id, message: "आपकी स्वयंसेवक रुचि समीक्षा के लिए दर्ज हुई।" });
  } catch (error) { next(error); }
});

function authorized(req) {
  const supplied = req.get("authorization")?.replace(/^Bearer\\s+/i, "") || "";
  if (!adminApiKey || supplied.length !== adminApiKey.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(adminApiKey));
}

app.get("/api/admin/submissions", async (req, res, next) => {
  if (!authorized(req)) return res.status(401).json({ error: "अनुमति नहीं है।" });
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const [requests, volunteers] = await Promise.all([
      HelpRequest.find().sort({ createdAt: -1 }).limit(limit).lean(),
      Volunteer.find().sort({ createdAt: -1 }).limit(limit).lean()
    ]);
    const items = [...requests, ...volunteers]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
    res.json({ items });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error("API error:", error.message);
  if (error?.name === "ValidationError" || error?.name === "StrictModeError") {
    return res.status(400).json({ error: "जानकारी मान्य नहीं है।" });
  }
  res.status(500).json({ error: "सर्वर में समस्या है। कृपया बाद में प्रयास करें।" });
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI environment variable is required");
  if (!adminApiKey || adminApiKey.length < 32) throw new Error("ADMIN_API_KEY must be set to a random value of at least 32 characters");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  app.listen(port, "0.0.0.0", () => console.log(`Shivasha Seva API listening on ${port}`));
}

start().catch(error => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
