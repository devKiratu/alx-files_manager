/* eslint-disable consistent-return */
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import Queue from 'bull/lib/queue';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job, done) => {
  const { userId, fileId } = job.data;
  if (!fileId) {
    return done(new Error('Missing fileId'));
  }
  if (!userId) {
    return done(new Error('Missing userId'));
  }
  const file = await dbClient.getFile(fileId, userId);
  if (!file) {
    return done(new Error('File not found'));
  }
  const thumbnailWidths = [500, 250, 100];
  thumbnailWidths.forEach(async (width) => {
    try {
      const thumbnail = await imageThumbnail(file.localPath, { width });
      /* eslint-disable-next-line consistent-return */
      const filePath = `${file.localPath}_${width}`;
      fs.writeFile(filePath, thumbnail, { flag: 'w+' }, (err) => {
        if (err) {
          throw err;
        }
      });
    } catch (error) {
      return done(new Error(error));
    }
  });
  return done();
});

userQueue.process(async (job, done) => {
  const { userId } = job.data;
  if (!userId) {
    return done(new Error('Missing userId'));
  }
  const user = await dbClient.getUserById(userId);
  if (!user) {
    return done(new Error('User not found'));
  }
  console.log(`Welcome ${user.email}`);
  return done();
});
