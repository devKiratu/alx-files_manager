import sha1 from 'sha1';
import * as uuid from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    const credentials = authHeader.split(' ')[1];
    /* eslint-disable-next-line no-undef */
    const decodedCredentials = atob(credentials);
    const [email, password] = decodedCredentials.split(':');
    const db = dbClient._mongoClient.db(dbClient._dbName);
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email, password: sha1(password) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = uuid.v4();

    await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

export default AuthController;
