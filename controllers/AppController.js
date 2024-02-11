/* eslint-disable class-methods-use-this */
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  getStats(req, res) {
    const users = dbClient.nbUsers();
    const files = dbClient.nbFiles();
    return res.json({ users, files });
  }

  getStatus(req, res) {
    const redis = redisClient.isAlive();
    const db = dbClient.isAlive();
    return res.json({ redis, db });
  }
}

export default AppController;
