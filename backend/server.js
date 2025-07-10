require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Notion Configuration
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_VERSION = "2022-06-28";

const notionHeaders = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  "Content-Type": "application/json",
  "Notion-Version": NOTION_VERSION,
};

// Fetch all entries from Notion database
const fetchNotionDatabase = async () => {
  const url = `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`;
  const response = await axios.post(url, {}, { headers: notionHeaders });
  return response.data;
};

// Endpoint: fetch data from Notion DB
app.get("/api/grouped-exercises", async (req, res) => {
  try {
    const notionData = await fetchNotionDatabase();

    const grouped = {};

    notionData.results.forEach((page) => {
      const name = page.properties?.Name?.title?.[0]?.plain_text || "Untitled";
      const category =
        page.properties?.Category?.select?.name || "Uncategorized";

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push(name);
    });

    res.json({ success: true, grouped });
  } catch (error) {
    console.error("[Notion API Error]", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
