const supabase = require("../supabaseClient"); // make sure this exists

async function resolveImageUrl(imageData, userId, bucket = "screenshots") {
  if (!imageData.startsWith("data:image")) {
    return imageData;
  }

  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const fs = require("fs");

fs.writeFileSync("test.jpg", buffer);

  const fileName = `${userId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: "image/jpeg",
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return data.publicUrl;
}


// THIS LINE IS MANDATORY
module.exports = {
  resolveImageUrl,
};