const Url = require('../models/urlModel');
const redisClient = require('../redisClient');
const { initializeRangeFromZooKeeper, generateShortUrl } = require('./zookeeperService');

async function createShortUrl(longUrl) {
  console.log('Received URL to shorten2:', longUrl);
  const shortUrl = generateShortUrl();
  console.log('shortUrl generated:', shortUrl);

  saveUrlToDbAndCache(longUrl, shortUrl); // Save to DB and cache asynchronously

  return shortUrl;
}

function saveUrlToDbAndCache(longUrl, shortUrl) {
    setTimeout(async () => {
      try {
        const url = new Url({ longUrl, shortUrl });
        await url.save();
        console.log('shortUrl saved to DB:', shortUrl);
  
        await redisClient.set(shortUrl, longUrl, { EX: 3600 });
        console.log('shortUrl cached in Redis:', shortUrl);
      } catch (error) {
        console.error('Error saving short URL to DB or cache:', error);
      }
    }, 0);
  }

module.exports = { createShortUrl };
