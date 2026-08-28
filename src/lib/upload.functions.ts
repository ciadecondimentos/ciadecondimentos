import { createServerFn } from "@tanstack/react-start";

export const uploadImage = createServerFn({ method: "POST" })
  .validator((data: FormData) => {
    const file = data.get("file");
    if (!(file instanceof File)) {
      throw new Error("Invalid file");
    }
    return { file };
  })
  .handler(async ({ data }) => {
    const cloudinaryUrl = process.env['CLOUDINARY_URL'];
    if (!cloudinaryUrl) {
      throw new Error("CLOUDINARY_URL not configured");
    }

    const { uploadToCloudinary } = await import("./upload.server");
    const arrayBuffer = await data.file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      return await uploadToCloudinary(buffer, cloudinaryUrl, data.file.name);
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      // More descriptive error for the UI
      if (error.message?.includes("Invalid api_key") || error.message?.includes("CLOUDINARY_URL")) {
        throw new Error("Configuração do Cloudinary inválida. Verifique as credenciais.");
      }
      throw new Error(`Falha no upload: ${error.message || 'Erro desconhecido'}`);
    }
  });
