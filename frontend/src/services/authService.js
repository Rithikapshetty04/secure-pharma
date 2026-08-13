import apiRequest from "./apiClient";

export async function loginUser(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function registerUser(registrationData) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(registrationData),
  });
}