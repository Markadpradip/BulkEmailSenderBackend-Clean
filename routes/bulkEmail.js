const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const nodemailer = require("nodemailer");
const BulkEmail = require("../models/BulkEmail");
const isValidEmail = require("../utils/validateEmail");
const checkMX = require("../utils/checkMx");

const router = express.Router();

/* Ensure uploads folder */
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads/");

const upload = multer({ dest: "uploads/" });

/* Nodemailer transporter */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ================= CSV + Row-based send ================= */
router.post("/bulk-send", upload.single("file"), async (req, res) => {
  const { subject, message, rows, sendType } = req.body;

  if (!req.file) return res.status(400).json({ message: "CSV file missing" });
  if (!subject || !message) return res.status(400).json({ message: "Subject or message missing" });

  const filePath = req.file.path;
  const results = [];
  let success = 0;
  let failed = 0;

  /* Convert selected rows to array */
  let selectedRows = [];
  if (sendType === "selected") {
    if (!rows) return res.status(400).json({ message: "Rows missing for selected option" });
    selectedRows = rows.split(",").map(n => parseInt(n.trim())).filter(Boolean);
    if (selectedRows.length === 0) return res.status(400).json({ message: "Invalid rows" });
  }

  const users = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => users.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  for (let i = 0; i < users.length; i++) {
    const rowNumber = i + 1;
    if (sendType === "selected" && !selectedRows.includes(rowNumber)) continue;

    const email = users[i].email?.trim();
    if (!email) {
      failed++;
      results.push({ email: null, status: "MISSING_EMAIL" });
      continue;
    }

    if (!isValidEmail(email)) {
      failed++;
      results.push({ email, status: "INVALID_FORMAT" });
      continue;
    }

    const domain = email.split("@")[1];
    const hasMx = await checkMX(domain);
    if (!hasMx) {
      failed++;
      results.push({ email, status: "NO_MX_RECORD" });
      continue;
    }

    try {
      await transporter.sendMail({
        from: `"Bulk Mailer" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: `<h3>Hello ${users[i].name || "User"}</h3><p>${message}</p>`,
      });

      await BulkEmail.create({
        email,
        name: users[i].name || "",
        subject,
        message,
        status: "SENT",
        source: "CSV",
      });

      success++;
      results.push({ email, status: "SENT" });
    } catch (err) {
      failed++;
      results.push({ email, status: "FAILED" });
    }
  }

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  return res.json({ success, failed, results });
});

/* ================= Manual Emails ================= */
router.post("/manual-send", async (req, res) => {
  const { emails, subject, message } = req.body;

  if (!emails || !subject || !message) return res.status(400).json({ message: "Missing fields" });

  const emailList = emails.split(",").map(e => e.trim()).filter(Boolean);
  if (emailList.length === 0) return res.status(400).json({ message: "No valid emails" });

  const results = [];
  let success = 0;
  let failed = 0;

  for (const email of emailList) {
    if (!isValidEmail(email)) {
      failed++;
      results.push({ email, status: "INVALID_FORMAT" });
      continue;
    }

    const domain = email.split("@")[1];
    const hasMx = await checkMX(domain);
    if (!hasMx) {
      failed++;
      results.push({ email, status: "NO_MX_RECORD" });
      continue;
    }

    try {
      await transporter.sendMail({
        from: `"Bulk Mailer" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: `<p>${message}</p>`,
      });

      await BulkEmail.create({ email, subject, message, status: "SENT", source: "MANUAL" });
      success++;
      results.push({ email, status: "SENT" });
    } catch (err) {
      failed++;
      results.push({ email, status: "FAILED" });
    }
  }

  return res.json({ success, failed, results });
});

module.exports = router;
