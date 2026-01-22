const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/email", require("./routes/emailRoutes"));
app.use("/api/bulk-email", require("./routes/bulkEmail")); // ✅ file must exist

app.get("/", (req, res) => {
  res.send("bulk email sender 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));

