require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// ── In-memory OTP store ──────────────────────────────────────────────
// Map<email, { otp: string, expiresAt: number }>
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Nodemailer transporter (Gmail SMTP) ──────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Verify transporter on startup
transporter.verify((err) => {
  if (err) {
    console.error("❌ SMTP connection failed:", err.message);
  } else {
    console.log("✅ SMTP connection ready");
  }
});

// ── POST /send-otp ───────────────────────────────────────────────────
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otp = generateOTP();

    otpStore.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
    });

    // Auto-cleanup after expiry
    setTimeout(() => {
      const stored = otpStore.get(normalizedEmail);
      if (stored && stored.otp === otp) {
        otpStore.delete(normalizedEmail);
      }
    }, OTP_EXPIRY_MS + 1000);

    await transporter.sendMail({
      from: `"MindCareAI" <${process.env.EMAIL_USER}>`,
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

    console.log(`📧 OTP sent to ${normalizedEmail}`);
    return res.json({ success: true, message: "OTP sent successfully." });
  } catch (err) {
    console.error("Failed to send OTP:", err.message);
    return res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

// ── POST /verify-otp ─────────────────────────────────────────────────
app.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const stored = otpStore.get(normalizedEmail);

    if (!stored) {
      return res.status(400).json({ error: "No OTP found. Please request a new one." });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (stored.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    // OTP is valid — remove it
    otpStore.delete(normalizedEmail);
    console.log(`✅ OTP verified for ${normalizedEmail}`);
    return res.json({ success: true, message: "OTP verified successfully." });
  } catch (err) {
    console.error("OTP verification error:", err.message);
    return res.status(500).json({ error: "Verification failed. Please try again." });
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
