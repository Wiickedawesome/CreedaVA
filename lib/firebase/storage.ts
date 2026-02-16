/**
 * Firebase Storage — upload helper for images & files.
 *
 * Provides typed upload functions for blog images, forum attachments, etc.
 * Files are stored under organised paths: blog/{postId}/, forum/{threadId}/, etc.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  type: string;
  size: number;
}

/**
 * Upload a file to Firebase Storage.
 * @param file  - File object from input[type=file]
 * @param folder - Storage path prefix, e.g. "blog/abc123" or "forum/xyz789"
 * @returns     - Download URL + metadata
 */
export async function uploadFile(
  file: File,
  folder: string,
): Promise<UploadResult> {
  // Sanitise filename — keep extension, replace spaces
  const safeName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const storagePath = `${folder}/${safeName}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file, {
    contentType: file.type,
    customMetadata: { originalName: file.name },
  });

  const url = await getDownloadURL(fileRef);

  return {
    url,
    path: storagePath,
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

/**
 * Upload multiple files to Firebase Storage.
 */
export async function uploadFiles(
  files: File[],
  folder: string,
): Promise<UploadResult[]> {
  return Promise.all(files.map((f) => uploadFile(f, folder)));
}

/**
 * Upload an image file with validation (max 10 MB, image types only).
 */
export async function uploadImage(
  file: File,
  folder: string,
): Promise<UploadResult> {
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    throw new Error("Image must be under 10 MB");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image (JPEG, PNG, GIF, WebP)");
  }
  return uploadFile(file, folder);
}

/**
 * Delete a file from Firebase Storage by its storage path.
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const fileRef = ref(storage, storagePath);
  await deleteObject(fileRef);
}
