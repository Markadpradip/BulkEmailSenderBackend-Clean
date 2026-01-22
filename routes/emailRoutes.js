const express = require("express");
const router = express.Router();
const { sendBulkEmail } = require("../controllers/emailController");
const auth = require("../middleware/authMiddleware");



console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "LOADED" : "NOT LOADED");

router.post("/send", auth, sendBulkEmail);

module.exports = router;
