import { createHash } from "crypto";

interface CloudinaryCreds {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

/**
 * Parses a CLOUDINARY_URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME),
 * tolerating stray whitespace, quotes or angle brackets around the value.
 */
export function parseCloudinaryUrl(raw: string): CloudinaryCreds {
  const cleaned = raw.trim().replace(/^["'<]+|[">']+$/g, "").replace(/[<>]/g, "");
  const match = cleaned.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!match) {
    throw new Error(
      "CLOUDINARY_URL inválida. Use o formato cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
    );
  }
  return {
    api_key: match[1]!.trim(),
    api_secret: match[2]!.trim(),
    cloud_name: match[3]!.replace(/\/+$/, "").trim(),
  };
}

/**
 * Uploads directly to the Cloudinary REST endpoint using a signed request.
 * Avoids the Node-only Cloudinary SDK so it also works on the edge runtime.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  cloudinaryUrl: string,
  filename = "upload"
): Promise<{ url: string }> {
  const { api_key, api_secret, cloud_name } = parseCloudinaryUrl(cloudinaryUrl);

  const folder = "produtos";
  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${api_secret}`)
    .digest("hex");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]), filename);
  form.append("api_key", api_key);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    { method: "POST", body: form }
  );

  const json: any = await res.json();
  if (!res.ok || json?.error) {
    throw new Error(json?.error?.message || "Falha no upload da imagem");
  }

  return { url: json.secure_url as string };
}
