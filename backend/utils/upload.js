// utils/upload.js
// ─────────────────────────────────────────────────────────────────────────────
// Screenshot upload utility.
// Handles two cases:
//   1. image_url is a base64 data URL  → decode, upload to Supabase Storage,
//      return the public URL
//   2. image_url is already a URL      → return as-is
// ─────────────────────────────────────────────────────────────────────────────

const { v4: uuidv4 } = require("uuid");
const supabase = require("../supabaseClient");

const BUCKET = "screenshots";

/**
 * Resolves a final public image URL, uploading to storage if needed.
 *
 * @param {string} imageUrl   - Either a base64 data URL or an existing URL
 * @param {string} userId     - Used to namespace the file path in storage
 * @returns {Promise<string>} - Public URL of the stored image
 */
async function resolveImageUrl(imageUrl, userId) {
  // If it's not base64, it's already a URL — save directly
  if (!imageUrl.startsWith("data:image")) {
    return imageUrl;
  }

  // ── Parse base64 data URL ─────────────────────────────────────────────────
  // Format: "data:image/png;base64,<data>"
  const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 image format.");
  }

  const extension = matches[1];   // e.g. "png"
  const base64Data = matches[2];  // raw base64 string
  const buffer = Buffer.from(base64Data, "base64");

  // ── Build a unique file path ───────────────────────────────────────────────
  // e.g. emp_john_001/2026-03-24T10-45-00_a1b2c3.png
  const safeTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${userId}/${safeTimestamp}_${uuidv4().slice(0, 6)}.${extension}`;

  // ── Upload to Supabase Storage ────────────────────────────────────────────
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: `image/${extension}`,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // ── Get public URL ────────────────────────────────────────────────────────
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);

  if (!data?.publicUrl) {
    throw new Error("Could not retrieve public URL after upload.");
  }

  return data.publicUrl;
}

module.exports = { resolveImageUrl };
