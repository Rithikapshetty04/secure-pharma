import apiRequest from "./apiClient";

export async function getOrganizations() {
  return apiRequest("/organizations");
}

export async function getOrganizationById(organizationId) {
  return apiRequest(`/organizations/${organizationId}`);
}