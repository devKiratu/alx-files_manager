import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import Queue from 'bull/lib/queue';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job, done) => {
  const { userId, fileId } = job.data;
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }
  const file = await dbClient.getFile(fileId, userId);
  if (!file) {
    throw new Error('File not found');
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
      throw new Error(error);
    }
  });
  done();
});

userQueue.process(async (job, done) => {
  const { userId } = job.data;
  if (!userId) {
    throw new Error('Missing userId');
  }
  const user = await dbClient.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  console.log(`Welcome ${user.email}`);
  done();
});
