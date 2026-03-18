const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: false });
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_MISSING_CONFIG = [];

if (!SUPABASE_URL) {
  SUPABASE_MISSING_CONFIG.push("SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL)");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  SUPABASE_MISSING_CONFIG.push("SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  : null;

// ── In-memory OTP store ──────────────────────────────────────────────
// Map<email, { otp: string, expiresAt: number }>
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const SMTP_NETWORK_ERROR_CODES = new Set(["EAI_AGAIN", "ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT"]);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOTP(email, otp) {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });

  setTimeout(() => {
    const stored = otpStore.get(email);
    if (stored && stored.otp === otp) {
      otpStore.delete(email);
    }
  }, OTP_EXPIRY_MS + 1000);
}

function consumeOTP(email, otp) {
  const normalizedEmail = email.trim().toLowerCase();
  const stored = otpStore.get(normalizedEmail);

  if (!stored) {
    return {
      ok: false,
      status: 400,
      error: "No OTP found. Please request a new one.",
    };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      ok: false,
      status: 400,
      error: "OTP has expired. Please request a new one.",
    };
  }

  if (stored.otp.toString().trim() !== otp.toString().trim()) {
    return {
      ok: false,
      status: 400,
      error: "Invalid OTP. Please try again.",
    };
  }

  otpStore.delete(normalizedEmail);
  return { ok: true, normalizedEmail };
}

function parseBoolean(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function buildTransportOptions() {
  const port = Number(process.env.SMTP_PORT || 587);
  const options = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 15000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 20000),
  };

  if (process.env.SMTP_SERVICE) {
    options.service = process.env.SMTP_SERVICE;
    return options;
  }

  if (process.env.SMTP_HOST) {
    options.host = process.env.SMTP_HOST;
    options.port = port;
    options.secure = parseBoolean(process.env.SMTP_SECURE, port === 465);
    return options;
  }

  options.service = "gmail";
  return options;
}

function getStartupSmtpHint(error) {
  if (SMTP_NETWORK_ERROR_CODES.has(error.code)) {
    return "The SMTP host could not be reached during startup. The server will keep running and email delivery can recover on the next send attempt.";
  }

  if (error.code === "EAUTH") {
    return "Check EMAIL_USER and EMAIL_APP_PASSWORD in the server environment.";
  }

  return null;
}

// ── Nodemailer transporter (Gmail SMTP) ──────────────────────────────
const transportOptions = buildTransportOptions();
const transporter = transportOptions.auth.user && transportOptions.auth.pass
  ? nodemailer.createTransport(transportOptions)
  : null;

// Verify transporter on startup
async function verifyTransporterOnStartup() {
  if (!transporter) {
    console.warn("⚠️ SMTP is not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD before sending OTP emails.");
    return;
  }

  try {
    await transporter.verify();
    console.log("✅ SMTP connection ready");
  } catch (error) {
    const code = error.code ? `${error.code}: ` : "";
    console.warn(`⚠️ SMTP startup verification failed: ${code}${error.message}`);

    const hint = getStartupSmtpHint(error);
    if (hint) {
      console.warn(hint);
    }
  }
}

void verifyTransporterOnStartup();

// ── POST /send-otp ───────────────────────────────────────────────────
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otp = generateOTP();

    if (!transporter) {
      return res.status(503).json({ error: "Email delivery is not configured on the server." });
    }

    await transporter.sendMail({
      from: `"MindCareAI" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Your MindCareAI Verification Code",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); border-radius: 16px; overflow: hidden;">
          <div style="padding: 40px 32px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0; font-weight: 700;">MindCareAI</h1>
            <p style="color: #e0d4f5; font-size: 15px; margin: 0;">Email Verification</p>
          </div>
          <div style="background: #ffffff; padding: 36px 32px; border-radius: 16px 16px 0 0;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">Use the following code to verify your email address:</p>
            <div style="background: #f3f0ff; border: 2px dashed #7c3aed; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #7c3aed;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">This code expires in <strong>5 minutes</strong>.</p>
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
          <div style="background: #f9fafb; padding: 20px 32px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} MindCareAI. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    storeOTP(normalizedEmail, otp);

    console.log(`📧 OTP sent to ${normalizedEmail}`);
    return res.json({ success: true, message: "OTP sent successfully." });
  } catch (err) {
    console.error("Failed to send OTP:", err.code || "UNKNOWN", err.message);
    const statusCode = SMTP_NETWORK_ERROR_CODES.has(err.code) ? 503 : 500;
    return res.status(statusCode).json({ error: "Failed to send OTP. Please try again." });
  }
});

// ── POST /verify-otp ─────────────────────────────────────────────────
app.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const otpResult = consumeOTP(email, otp);
    if (!otpResult.ok) {
      return res.status(otpResult.status).json({ error: otpResult.error });
    }

    const { normalizedEmail } = otpResult;
    console.log(`✅ OTP verified for ${normalizedEmail}`);
    return res.json({ success: true, message: "OTP verified successfully." });
  } catch (err) {
    console.error("OTP verification error:", err.message);
    return res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

// ── POST /verify-otp-signup ──────────────────────────────────────────
app.post("/verify-otp-signup", async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: "Email, OTP, and password are required." });
    }

    if (typeof email !== "string" || typeof otp !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Invalid request payload." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    if (!supabaseAdmin) {
      return res.status(503).json({
        error: `Signup service is not configured on the OTP server. Missing: ${SUPABASE_MISSING_CONFIG.join(", ")}.`,
      });
    }

    const otpResult = consumeOTP(email, otp);
    if (!otpResult.ok) {
      return res.status(otpResult.status).json({ error: otpResult.error });
    }

    const { normalizedEmail } = otpResult;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (error) {
      const lowerMessage = (error.message || "").toLowerCase();
      if (
        lowerMessage.includes("already")
        || lowerMessage.includes("exists")
        || lowerMessage.includes("registered")
      ) {
        return res.status(409).json({
          error: "An account with this email already exists. Please login instead.",
        });
      }

      console.error("Supabase user creation failed:", error.message);
      return res.status(500).json({ error: "Failed to create account. Please try again." });
    }

    console.log(`✅ OTP verified and account created for ${normalizedEmail}`);
    return res.json({
      success: true,
      message: "Account created successfully.",
      userId: data?.user?.id ?? null,
    });
  } catch (err) {
    console.error("OTP signup verification error:", err.message);
    return res.status(500).json({ error: "Signup verification failed. Please try again." });
  }
});

// ── Health check ─────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Start server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 OTP server running on http://localhost:${PORT}`);
});
