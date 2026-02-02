const CLOUD_NAME = "dhhbjialq";
const UPLOAD_PRESET = "ml_default";

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    if (!response.ok) throw new Error("Falha no upload");
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Erro Cloudinary:", error);
    throw error;
  }
};
