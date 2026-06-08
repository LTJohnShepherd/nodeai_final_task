const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getHistory, saveHistory } = require("../utils/history");
const { sendBrevoEmail } = require("../utils/brevo");
require("dotenv").config({ quiet: true });

const router = express.Router();
const aiClient = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const MODEL_NAME = "gemini-3.1-flash-lite-preview";
const MAX_WORDS = 25;

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const trimToLimit = (text) => text.trim().split(/\s+/).filter(Boolean).slice(0, MAX_WORDS).join(" ");

const buildHistoryNote = (history) => {
  if (!Array.isArray(history) || history.length === 0) return "";
  return history
    .map((item, index) => `בקשה ${index + 1}: ${item.prompt} -> ${item.ad}`)
    .join("\n");
};

router.post("/", async (req, res) => {
  try {
    const PROMPT = req.body?.PROMPT;
    const GENERE = req.body?.GENERE;
    const EMAIL = req.body?.EMAIL;
    const USER_ID = req.body?.USER_ID;

    if (!PROMPT || !GENERE || !EMAIL || !USER_ID) {
      return res.status(400).json({ error: "Missing PROMPT, GENERE, EMAIL or USER_ID." });
    }

    if (!process.env.GEMINI_KEY || !process.env.BREVO_KEY || !process.env.BREVO_EMAIL) {
      return res.status(500).json({ error: "Missing GEMINI_KEY, BREVO_KEY or BREVO_EMAIL in .env." });
    }

    const history = getHistory(USER_ID);
    const historySection = buildHistoryNote(history);

    const model = aiClient.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction:
        "אתה סוכן פרסום. צור טקסט שיווקי קצר, מדויק ולא יותר מ-25 מילים. החזר רק את הטקסט של הפרסומת ללא הסברים או כותרות."
    });

    const promptText = `הנח את עצמך כסוכן שיווק. צור פרסומת על בסיס התיאור הבא:\n${PROMPT}\nסגנון כתיבה: ${GENERE}${historySection ? `\n\nהיסטוריית בקשות קודמות:\n${historySection}` : ""}`;

    const { response } = await model.generateContent(promptText);
    let adText = response.text().trim();

    if (countWords(adText) > MAX_WORDS) {
      adText = trimToLimit(adText);
    }

    saveHistory({ prompt: PROMPT, ad: adText, genre: GENERE, createdAt: new Date().toISOString() }, USER_ID);

    await sendBrevoEmail(EMAIL, "הפרסומת החדשה שלך מוכנה!", `<p>${adText}</p>`, process.env.BREVO_EMAIL);

    res.json({ ad: adText, email: EMAIL, userId: USER_ID });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Failed to generate advertisement or send email." });
  }
});

module.exports = router;
