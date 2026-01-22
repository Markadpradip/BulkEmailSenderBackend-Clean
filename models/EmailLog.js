const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    to: String,
    subject: String,
    status: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailLog", emailLogSchema);
