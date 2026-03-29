// utils/upload.js
// ─────────────────────────────────────────────────────────────────────────────
// Resolves an image value to a public Supabase Storage URL.
// If the value is already a URL (not base64), it is returned as-is.
// Otherwise the base64 data is uploaded to the specified bucket.
// ─────────────────────────────────────────────────────────────────────────────

const supabase = require("../supabaseClient");

/**
 * @param {string} imageData  - base64 data URL or existing public URL
 * @param {string} userId     - used as the storage folder name
 * @param {string} bucket     - Supabase Storage bucket name
 * @returns {Promise<string>} - public URL of the stored image
 */
async function resolveImageUrl(imageData, userId, bucket = "screenshots") {
  // Already a URL — nothing to upload
  if (!imageData.startsWith("data:image")) {
    return imageData;
  }

  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const fileName = `${userId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, { contentType: "image/jpeg" });

  if (error) {
    throw new Error(`Upload to "${bucket}" failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

module.exports = { resolveImageUrl };