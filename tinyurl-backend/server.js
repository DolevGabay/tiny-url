// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const urlCreationService = require('./services/urlCreationService');
const urlRedirectService = require('./services/urlRedirectService');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((error) => console.error("Error connecting to MongoDB Atlas:", error));

app.post('/api/shorten', async (req, res) => {
  const { longUrl } = req.body;
  console.log('Received URL to shorten:', longUrl);
  try {
    const shortUrl = await urlCreationService.createShortUrl(longUrl);
    res.json({ shortUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  try {
    const redirectUrl = await urlRedirectService.getRedirectUrl(shortUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    res.status(404).json({ error: 'URL not found' });
  }
});

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

