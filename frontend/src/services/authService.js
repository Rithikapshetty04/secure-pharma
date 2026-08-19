import apiRequest from "./apiClient";

export async function loginUser(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function registerUser(registrationData) {
  const formData = new FormData();

  Object.entries(registrationData).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });

  return apiRequest("/auth/register", {
    method: "POST",
    body: formData,
  });
}