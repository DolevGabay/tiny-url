// services/urlRedirectService.js
const Url = require('../models/urlModel');
const redisClient = require('../redisClient');

async function getRedirectUrl(shortUrl) {
  try {
    const cachedUrl = await redisClient.get(shortUrl);

    if (cachedUrl) {
      console.log('URL found in cache:', cachedUrl);
      incrementClicks(shortUrl); // Increment clicks in DB asynchronously
      return cachedUrl;
    }

    const url = await Url.findOne({ shortUrl });
    if (url) {
      url.clicks++;
      await url.save();
      await redisClient.set(shortUrl, url.longUrl, { EX: 3600 });
      return url.longUrl;
    } else {
      throw new Error('URL not found');
    }
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw error;
  }
}

async function incrementClicks(shortUrl) {
  setTimeout(async () => {
    try {
      const url = await Url.findOne({ shortUrl });
      if (url) {
        url.clicks++;
        await url.save();
        console.log('Clicks count updated in DB for cached URL:', shortUrl);
      }
    } catch (dbError) {
      console.error('Error updating clicks in DB:', dbError);
    }
  }, 0);
}

module.exports = { getRedirectUrl };
