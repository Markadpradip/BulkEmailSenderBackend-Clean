const mongoose = require("mongoose");

const bulkEmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
  type: String,
  enum: ["SENT", "FAILED"],
  default: "SENT",
},

  },
  { timestamps: true }
);

module.exports = mongoose.model("BulkEmail", bulkEmailSchema);
