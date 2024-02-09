import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this._client = createClient();
    this._client
      .on('error', (errorMsg) => console.log(`${errorMsg}`));
  }

  isAlive() {
    return this._client.ping();
  }

  async get(key) {
    const getAsync = promisify(this._client.get).bind(this._client);
    const value = await getAsync(key);
    return value;
  }

  async set(key, value, duration) {
    const setAsync = promisify(this._client.set).bind(this._client);
    await setAsync(key, value, 'EX', duration);
  }

  async del(key) {
    const delAsync = promisify(this._client.del).bind(this._client);
    await delAsync(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
