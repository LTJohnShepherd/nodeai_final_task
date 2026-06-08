const express = require("express");
const aiAgentRouter = require("./routes/ai_agent");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use("/ai_agent", aiAgentRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
