import { MongoClient, ObjectID } from 'mongodb';

class DBClient {
  constructor() {
    this._dbHost = process.env.DB_HOST || 'localhost';
    this._dbPort = process.env.DB_PORT || 27017;
    this._dbName = process.env.DB_DATABASE || 'files_manager';
    const dbUrl = `mongodb://${this._dbHost}:${this._dbPort}`;
    this._mongoClient = new MongoClient(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this._isConnected = false;
    this._isAlive = false;
    this._mongoClient.connect()
      .then(() => { this._isConnected = true; })
      .catch((err) => console.log(err));
  }

  isAlive() {
    return this._isConnected;
  }

  async nbUsers() {
    const db = this._mongoClient.db(this._dbName);
    const usersCollection = db.collection('users');
    const docs = await usersCollection.find({}).toArray();
    return docs.length;
  }

  async nbFiles() {
    const db = this._mongoClient.db(this._dbName);
    const filesCollection = db.collection('files');
    const docs = await filesCollection.find({}).toArray();
    return docs.length;
  }

  async getFile(fileId, userId) {
    try {
      const db = this._mongoClient.db(this._dbName);
      const filesCollection = db.collection('files');
      const file = await filesCollection.findOne({
        _id: new ObjectID(fileId), userId: new ObjectID(userId),
      });
      return file;
    } catch (error) {
      return null;
    }
  }

  async getAllFiles(parentId, page) {
    const currentPage = page ? parseInt(page, 10) : 0;
    const maxPages = 20;
    const db = this._mongoClient.db(this._dbName);
    const filesCollection = db.collection('files');
    if (!parentId) {
      const files = await filesCollection.aggregate([
        { $skip: currentPage * maxPages },
        { $limit: maxPages },
        { $addFields: { id: '$_id' } },
        { $project: { _id: 0 } },
      ]).toArray();
      return files;
    }
    const files = await filesCollection.aggregate([
      { $match: { parentId } },
      { $skip: currentPage * maxPages },
      { $limit: maxPages },
      { $addFields: { id: '$_id' } },
      { $project: { _id: 0 } },
    ]).toArray();
    return files;
  }

  async publishFile(fileId, userId) {
    const db = this._mongoClient.db(this._dbName);
    const filesCollection = db.collection('files');
    const updatedDocument = await filesCollection.findOneAndUpdate(
      { _id: new ObjectID(fileId), userId: new ObjectID(userId) },
      { $set: { isPublic: true } },
      { returnOriginal: false },
    );
    return updatedDocument.value;
  }

  async unpublishFile(fileId, userId) {
    const db = this._mongoClient.db(this._dbName);
    const filesCollection = db.collection('files');
    const updatedDocument = await filesCollection.findOneAndUpdate(
      { _id: new ObjectID(fileId), userId: new ObjectID(userId) },
      { $set: { isPublic: false } },
      { returnOriginal: false },
    );
    return updatedDocument.value;
  }
}

const dbClient = new DBClient();
export default dbClient;
