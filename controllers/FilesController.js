import { ObjectID } from 'mongodb';
import * as uuid from 'uuid';
import fs from 'fs';
import * as mime from 'mime-types';
import Queue from 'bull/lib/queue';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export const fileQueue = new Queue('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!('name' in req.body)) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const acceptedTypes = ['folder', 'file', 'image'];
    if (!('type' in req.body) || !acceptedTypes.includes(req.body.type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!('data' in req.body) && req.body.type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    const db = dbClient._mongoClient.db(dbClient._dbName);
    const filesCollection = db.collection('files');

    if ('parentId' in req.body) {
      const parentFile = await filesCollection.findOne({
        _id: new ObjectID(req.body.parentId),
      });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    // upload folder
    if (req.body.type === 'folder') {
      const uploadObj = {
        userId: new ObjectID(userId),
        name: req.body.name,
        type: req.body.type,
        parentId: req.body.parentId ? req.body.parentId : 0,
        isPublic: req.body.isPublic ? req.body.isPublic : false,
      };
      const result = await filesCollection.insertOne(uploadObj);
      const {
        userId: usrId, name, type, parentId, isPublic, _id,
      } = result.ops[0];
      return res.status(201).json({
        id: _id, userId: usrId, name, type, isPublic, parentId,
      });
    }
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    // create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
    const data = Buffer.from(req.body.data, 'base64');
    const fileName = uuid.v4();
    const localPath = `${folderPath}/${fileName}`;
    /* eslint-disable-next-line consistent-return */
    fs.writeFile(localPath, data, { flag: 'w+' }, (err) => {
      if (err) {
        return res.status(500).json({ error: `Could not save file: ${err}` });
      }
    });
    const uploadObj = {
      userId: new ObjectID(userId),
      name: req.body.name,
      type: req.body.type,
      parentId: req.body.parentId ? req.body.parentId : 0,
      isPublic: req.body.isPublic ? req.body.isPublic : false,
      localPath,
    };
    const result = await filesCollection.insertOne(uploadObj);
    const {
      userId: usrId, name, type, parentId, isPublic, _id,
    } = result.ops[0];

    // Add file to job queue if its type is image
    if (type === 'image') {
      fileQueue.add({ userId, fileId: _id });
    }

    return res.status(201).json({
      id: _id, userId: usrId, name, type, isPublic, parentId,
    });
  }

  static async getShow(req, res) {
    const fileId = req.params.id;
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const file = await dbClient.getFile(fileId, userId);
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    const {
      userId: usrId, name, type, parentId, isPublic, _id,
    } = file;
    return res.json({
      id: _id, userId: usrId, name, type, isPublic, parentId,
    });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { parentId, page } = req.query;
    const files = await dbClient.getAllFiles(parentId, page);
    return res.json(files);
  }

  static async putPublish(req, res) {
    const fileId = req.params.id;
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const file = await dbClient.publishFile(fileId, userId);
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    const {
      userId: usrId, name, type, parentId, isPublic, _id,
    } = file;
    return res.json({
      id: _id, userId: usrId, name, type, isPublic, parentId,
    });
  }

  static async putUnpublish(req, res) {
    const fileId = req.params.id;
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const file = await dbClient.unpublishFile(fileId, userId);
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    const {
      userId: usrId, name, type, parentId, isPublic, _id,
    } = file;
    return res.json({
      id: _id, userId: usrId, name, type, isPublic, parentId,
    });
  }

  static async getFile(req, res) {
    const { size } = req.query;
    const fileId = req.params.id;
    const token = req.headers['x-token'];
    const file = await dbClient.getFileById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (!file.isPublic) {
      if (!token) {
        return res.status(404).json({ error: 'Not found' });
      }
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (userId !== file.userId.toString()) {
        return res.status(404).json({ error: 'Not found' });
      }
    }
    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }
    const filePath = size ? `${file.localPath}_${size}` : file.localPath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }
    const contentType = mime.lookup(file.name);
    res.set('Content-Type', contentType);
    return res.sendFile(filePath);
  }
}

export default FilesController;
