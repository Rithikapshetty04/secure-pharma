import apiRequest from "./apiClient";

export async function getProducts() {
  return apiRequest("/products");
}

export async function getProductById(productId) {
  return apiRequest(`/products/${productId}`);
}