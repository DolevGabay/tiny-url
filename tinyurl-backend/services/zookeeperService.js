const zookeeper = require('node-zookeeper-client');
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = ALPHABET.length;

let rangeStart = 0;
let rangeEnd = 0;
let counter = 0;

const client = zookeeper.createClient('localhost:2181');

client.once('connected', async () => {
  console.log('Connected to ZooKeeper');
  await initializeRangeFromZooKeeper();
});

client.connect();

// Custom promisified versions of the client methods
function createAsync(path, data, mode) {
  return new Promise((resolve, reject) => {
    client.create(path, data, mode, (error, createdPath) => {
      if (error) {
        return reject(error);
      }
      resolve(createdPath);
    });
  });
}

function existsAsync(path) {
  return new Promise((resolve, reject) => {
    client.exists(path, (error, stat) => {
      if (error) {
        return reject(error);
      }
      resolve(stat);
    });
  });
}

function getDataAsync(path) {
  return new Promise((resolve, reject) => {
    client.getData(path, (error, data, stat) => {
      if (error) {
        return reject(error);
      }
      resolve({ data, stat });
    });
  });
}

function setDataAsync(path, data, version) {
  return new Promise((resolve, reject) => {
    client.setData(path, data, version, (error, stat) => {
      if (error) {
        return reject(error);
      }
      resolve(stat);
    });
  });
}

async function initializeRangeFromZooKeeper() {
  try {
    // Ensure the parent node exists
    try {
      await createAsync('/url_shortener', null, zookeeper.CreateMode.PERSISTENT);
    } catch (error) {
      if (error.code !== zookeeper.Exception.NODE_EXISTS) {
        console.error('Failed to create /url_shortener node:', error);
        return;
      }
    }

    // Check if the range node exists
    const stat = await existsAsync('/url_shortener/range');
    if (!stat) {
      await createAsync('/url_shortener/range', Buffer.from('0'), zookeeper.CreateMode.PERSISTENT);
      console.log('/url_shortener/range node created with initial value 0');
    }

    // Use version checking to ensure atomic increment
    let success = false;
    while (!success) {
      try {
        const { data, stat } = await getDataAsync('/url_shortener/range');
        let currentValue = parseInt(data.toString());

        const newValue = currentValue + 1;

        await setDataAsync('/url_shortener/range', Buffer.from(newValue.toString()), stat.version);
        success = true;  

        console.log(`/url_shortener/range value incremented to ${newValue}`);

        const startId = newValue * 1000000;
        rangeStart = startId;
        rangeEnd = startId + 1000000;
        counter = rangeStart;
        console.log(`Allocated range for instance: ${rangeStart} - ${rangeEnd}`);
      } catch (error) {
        if (error.code === zookeeper.Exception.BADVERSION) {
          console.log("Version mismatch, retrying range increment...");
        } else {
          console.error('Error incrementing range in ZooKeeper:', error);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error in initializeRangeFromZooKeeper:', error);
  }
}

function generateShortUrl() {
  if (counter >= rangeEnd) {
    throw new Error('ID range exceeded, please request a new range from ZooKeeper');
  }
  console.log('Generating short URL');

  const shortUrl = encodeBase62(counter);
  counter += 1;
  console.log(counter, shortUrl);
  return shortUrl;
}

function encodeBase62(num) {
  let encoded = '';
  while (num > 0) {
    encoded = ALPHABET[num % BASE] + encoded;
    num = Math.floor(num / BASE);
  }
  return encoded.padStart(7, '0');
}

module.exports = { initializeRangeFromZooKeeper, generateShortUrl };
