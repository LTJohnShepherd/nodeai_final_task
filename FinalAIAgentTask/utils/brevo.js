const axios = require("axios");
require("dotenv").config({ quiet: true });

exports.sendBrevoEmail = async (recipientEmail, subject, htmlContent, senderEmail) => {
  const apiKey = process.env.BREVO_KEY;
  const fromEmail = senderEmail || process.env.BREVO_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error("Missing BREVO_KEY or BREVO_EMAIL in environment variables.");
  }

  const payload = {
    sender: {
      name: "Advertising Agent",
      email: fromEmail
    },
    to: [{ email: recipientEmail }],
    subject,
    htmlContent
  };

  const config = {
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json"
    }
  };

  const response = await axios.post("https://api.brevo.com/v3/smtp/email", payload, config);
  return response.data;
};
