import type { Messages } from "@/lib/i18n";

// Button and status text for image uploads (artwork, artist photo, profile photo), so they never say "audio".
export function imageUploadLabels(t: Messages, kind: "cover" | "photo") {
  const u = t.studio.upload, img = t.studio.imageUpload;
  return { uploading: u.uploading, ...img[kind], errors: { ...u.errors, ...img.errors, type: u.imageTypeError } };
}
