/* eslint-disable class-methods-use-this */
import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    if (!('email' in req.body)) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!('password' in req.body)) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const { email, password } = req.body;
    const db = dbClient._mongoClient.db(dbClient._dbName);
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'Already exist' });
    }
    const hashedPwd = sha1(password);
    const userObj = {
      email,
      password: hashedPwd,
    };
    const newUser = await usersCollection.insertOne(userObj);
    const newUserObj = newUser.ops[0];
    return res.status(201).json({ id: newUserObj._id, email: newUserObj.email });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const db = dbClient._mongoClient.db(dbClient._dbName);
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectID(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.json({ id: user._id, email: user.email });
  }
}

export default UsersController;
