import { ObjectID } from 'mongodb';
import * as uuid from 'uuid';
import fs from 'fs';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

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
        parentId: new ObjectID(req.body.parentId),
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
    fs.access(folderPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.err('FILE ERROR ', err);
        fs.mkdir(folderPath, (err) => {
          if (err) {
            console.error(err);
          }
        });
      }
    });
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
    return res.status(201).json({
      id: _id, userId: usrId, name, type, isPublic, parentId,
    });
  }
}

export default FilesController;
