"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAttachmentThumbnail = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
const functions = __importStar(require("firebase-functions"));
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
const storage = (0, storage_1.getStorage)();
const THUMBNAIL_MAX_WIDTH = 600;
const THUMBNAIL_MAX_HEIGHT = 600;
exports.generateAttachmentThumbnail = functions
    .region('us-central1')
    .storage.object()
    .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType || '';
    if (!filePath)
        return;
    if (!filePath.startsWith('attachments/'))
        return;
    if (filePath.includes('/thumbnails/'))
        return;
    if (!contentType.startsWith('image/'))
        return;
    if (object.metadata?.skipThumbnail === 'true')
        return;
    const pathSegments = filePath.split('/');
    if (pathSegments.length < 3)
        return;
    const [, complaintId, ...rest] = pathSegments;
    if (!complaintId)
        return;
    const bucket = storage.bucket(object.bucket);
    const tempOriginalPath = path.join(os.tmpdir(), path.basename(filePath));
    const tempThumbPath = path.join(os.tmpdir(), `thumb_${path.basename(filePath)}`);
    try {
        await bucket.file(filePath).download({ destination: tempOriginalPath });
        const thumbnailSegments = ['attachments', complaintId, 'thumbnails', ...rest];
        const thumbnailPath = thumbnailSegments.join('/');
        await (0, sharp_1.default)(tempOriginalPath)
            .resize({
            width: THUMBNAIL_MAX_WIDTH,
            height: THUMBNAIL_MAX_HEIGHT,
            fit: 'inside',
            withoutEnlargement: true,
        })
            .jpeg({ quality: 72 })
            .toFile(tempThumbPath);
        const downloadToken = (0, uuid_1.v4)();
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
        const thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${object.bucket}/o/${encodeURIComponent(thumbnailPath)}?alt=media&token=${downloadToken}`;
        const complaintRef = db.collection('complaints').doc(complaintId);
        await db.runTransaction(async (tx) => {
            const complaintSnap = await tx.get(complaintRef);
            if (!complaintSnap.exists)
                return;
            const attachments = complaintSnap.get('attachments');
            if (!Array.isArray(attachments))
                return;
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
        await Promise.all(timelineSnapshot.docs.map((docSnap) => docSnap.ref.update({
            'attachment.thumbnailUrl': thumbnailUrl,
            'attachment.thumbnailStoragePath': thumbnailPath,
        })));
    }
    finally {
        fs.promises.unlink(tempOriginalPath).catch(() => undefined);
        fs.promises.unlink(tempThumbPath).catch(() => undefined);
    }
});
