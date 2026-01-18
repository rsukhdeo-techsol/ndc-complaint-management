import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as functions from 'firebase-functions';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const storage = getStorage();
const THUMBNAIL_MAX_WIDTH = 600;
const THUMBNAIL_MAX_HEIGHT = 600;

type FirestoreAttachmentRecord = Record<string, unknown> & {
  storagePath?: string;
};

export const generateAttachmentThumbnail = functions
  .region('us-central1')
  .storage.object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType || '';

    if (!filePath) return;
    if (!filePath.startsWith('attachments/')) return;
    if (filePath.includes('/thumbnails/')) return;
    if (!contentType.startsWith('image/')) return;
    if (object.metadata?.skipThumbnail === 'true') return;

    const pathSegments = filePath.split('/');
    if (pathSegments.length < 3) return;

    const [, complaintId, ...rest] = pathSegments;
    if (!complaintId) return;

    const bucket = storage.bucket(object.bucket);
    const tempOriginalPath = path.join(os.tmpdir(), path.basename(filePath));
    const tempThumbPath = path.join(os.tmpdir(), `thumb_${path.basename(filePath)}`);

    try {
      await bucket.file(filePath).download({ destination: tempOriginalPath });

      const thumbnailSegments = ['attachments', complaintId, 'thumbnails', ...rest];
      const thumbnailPath = thumbnailSegments.join('/');

      await sharp(tempOriginalPath)
        .resize({
          width: THUMBNAIL_MAX_WIDTH,
          height: THUMBNAIL_MAX_HEIGHT,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 72 })
        .toFile(tempThumbPath);

      const downloadToken = uuidv4();

      await bucket.upload(tempThumbPath, {
        destination: thumbnailPath,
        metadata: {
          contentType: 'image/jpeg',
          cacheControl: 'public,max-age=31536000,immutable',
          metadata: {
            skipThumbnail: 'true',
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });

      const thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${object.bucket}/o/${encodeURIComponent(
        thumbnailPath,
      )}?alt=media&token=${downloadToken}`;

      const complaintRef = db.collection('complaints').doc(complaintId);

      await db.runTransaction(async (tx) => {
        const complaintSnap = await tx.get(complaintRef);
        if (!complaintSnap.exists) return;

        const attachments = complaintSnap.get('attachments') as FirestoreAttachmentRecord[] | undefined;
        if (!Array.isArray(attachments)) return;

        let updated = false;
        const nextAttachments = attachments.map((attachment) => {
          if (attachment?.storagePath === filePath) {
            updated = true;
            return {
              ...attachment,
              thumbnailUrl,
              thumbnailStoragePath: thumbnailPath,
            };
          }
          return attachment;
        });

        if (updated) {
          tx.update(complaintRef, { attachments: nextAttachments });
        }
      });

      const timelineSnapshot = await complaintRef
        .collection('timeline')
        .where('attachment.storagePath', '==', filePath)
        .get();

      await Promise.all(
        timelineSnapshot.docs.map((docSnap) =>
          docSnap.ref.update({
            'attachment.thumbnailUrl': thumbnailUrl,
            'attachment.thumbnailStoragePath': thumbnailPath,
          }),
        ),
      );
    } finally {
      fs.promises.unlink(tempOriginalPath).catch(() => undefined);
      fs.promises.unlink(tempThumbPath).catch(() => undefined);
    }
  });
