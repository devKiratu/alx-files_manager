import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import { fileQueue } from './controllers/FilesController';
import dbClient from './utils/db';

fileQueue.process(async (job, done) => {
  const { userId, fileId } = job.data;
  if (!fileId) {
    done(new Error('Missing fileId'));
  }
  if (!userId) {
    done(new Error('Missing userId'));
  }
  const file = await dbClient.getFile(fileId, userId);
  if (!file) {
    done(new Error('File not found'));
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
      done(new Error(error));
    }
  });
  done();
});
