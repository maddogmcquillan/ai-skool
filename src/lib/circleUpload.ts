import { openAsBlob, statSync } from "node:fs";
import path from "node:path";
import { circleRequest, type CircleClientConfig } from "../circle.js";
import { blobKey, contentTypeFor, md5Base64 } from "./upload.js";

export interface DirectUpload {
  signed_id: string;
  attachable_sgid: string;
  direct_upload: { url: string; headers: Record<string, string> };
}

/**
 * Upload a local file to Circle's storage: POST /direct_uploads for a presigned URL, then PUT
 * the bytes. Returns the signed_id (for cover_image / thumbnail fields) and attachable_sgid
 * (for rich text bodies).
 */
export async function directUpload(cfg: CircleClientConfig, filePath: string, fetchImpl: typeof fetch = fetch): Promise<DirectUpload> {
  const byte_size = statSync(filePath).size;
  const checksum = await md5Base64(filePath);
  const filename = path.basename(filePath);
  const content_type = contentTypeFor(filePath);
  const raw = await circleRequest<DirectUpload | Record<string, DirectUpload>>(cfg, "POST", "/direct_uploads", {
    blob: { key: blobKey(), filename, content_type, byte_size, checksum },
  }, fetchImpl);
  // Some Circle create endpoints wrap the record; accept { direct_upload: {...} } at the top level or nested one level down.
  const du = ((raw as DirectUpload).direct_upload
    ? raw
    : Object.values(raw as Record<string, DirectUpload>).find((v) => v && typeof v === "object" && "direct_upload" in v)) as DirectUpload | undefined;
  if (!du?.direct_upload?.url || !du.signed_id) throw new Error(`Unexpected direct upload response: ${JSON.stringify(raw).slice(0, 300)}`);
  const headers: Record<string, string> = { ...du.direct_upload.headers };
  if (!Object.keys(headers).some((h) => h.toLowerCase() === "content-type")) headers["Content-Type"] = content_type;
  const res = await fetchImpl(du.direct_upload.url, { method: "PUT", headers, body: await openAsBlob(filePath) });
  if (!res.ok) throw new Error(`Storage PUT failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return du;
}
