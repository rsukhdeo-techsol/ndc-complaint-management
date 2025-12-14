import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../firebase';
import { AttachmentData } from '@/types';
import { generateStorageFileName, getAttachmentStoragePath } from '../utils';

/**
 * Upload a file to Firebase Storage
 */
export async function uploadAttachment(
  complaintId: string,
  file: File
): Promise<AttachmentData> {
  const fileName = generateStorageFileName(file.name);
  const storagePath = getAttachmentStoragePath(complaintId, fileName);
  const storageRef = ref(storage, storagePath);
  
  // Upload file
  await uploadBytes(storageRef, file);
  
  // Get download URL
  const fileUrl = await getDownloadURL(storageRef);
  
  return {
    fileName: file.name, // Original name for display
    fileUrl,
    fileType: file.type,
    fileSize: file.size,
    storagePath,
  };
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteAttachment(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}

/**
 * Delete all attachments for a complaint
 */
export async function deleteAllAttachments(
  attachments: AttachmentData[]
): Promise<void> {
  const deletePromises = attachments.map(attachment =>
    deleteAttachment(attachment.storagePath)
  );
  
  await Promise.all(deletePromises);
}
