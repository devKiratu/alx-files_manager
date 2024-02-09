import MongoClient from 'mongodb/lib/mongo_client';

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
}

const dbClient = new DBClient();
export default dbClient;
