import { createHash, randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import path from "node:path";

/** Base64-encoded MD5 of a file, the checksum Circle's direct upload endpoint expects. */
export function md5Base64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("md5");
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", () => resolve(hash.digest("base64")));
  });
}

/** Rails ActiveStorage-style blob key: 28 lowercase base36 characters. */
export function blobKey(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(28);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/x-m4v",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export function contentTypeFor(filePath: string): string {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

/** Loose match: case-insensitive, ignores extension, spaces, dashes and underscores. */
export function normalizeFileName(name: string): string {
  return path.basename(name, path.extname(name)).toLowerCase().replace(/[\s_\-]+/g, "");
}
