import API_BASE_URL from "../config/api";

export async function uploadLicenseDocument(file) {
  const formData = new FormData();

  formData.append("licenseDocument", file);

  const response = await fetch(
    `${API_BASE_URL}/licenses/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "License document upload failed."
    );
  }

  return data;
}