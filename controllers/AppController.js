/* eslint-disable class-methods-use-this */
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    return res.json({ users, files });
  }

  getStatus(req, res) {
    const redis = redisClient.isAlive();
    const db = dbClient.isAlive();
    return res.json({ redis, db });
  }
}

export default AppController;
