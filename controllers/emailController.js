const transporter = require("../config/mailer");
const EmailLog = require("../models/EmailLog");

exports.sendBulkEmail = async (req, res) => {
  const { recipients, subject, message } = req.body;

  try {
    for (let email of recipients) {
      try {
        await transporter.sendMail({
          from: `"Bulk Email App" <${process.env.EMAIL_USER}>`,
          to: email,
          subject,
          html: message
        });

        await EmailLog.create({
          to: email,
          subject,
          status: "sent"
        });

        console.log("✅ Email sent to:", email);
      } catch (error) {
        console.error("❌ Email failed for:", email);
        console.error(error.message); // 👈 REAL REASON

        await EmailLog.create({
          to: email,
          subject,
          status: "failed"
        });
      }
    }

    res.json({ message: "Bulk email process completed" });
  } catch (err) {
    res.status(500).json({ message: "Email sending failed" });
  }
};
