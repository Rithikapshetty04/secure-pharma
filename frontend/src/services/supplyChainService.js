import apiRequest from "./apiClient";

export async function getSupplyChainEvents(productId) {
  return apiRequest(`/supply-chain/products/${productId}/events`);
}

export async function createSupplyChainEvent(eventData) {
  return apiRequest("/supply-chain/events", {
    method: "POST",
    body: JSON.stringify(eventData),
  });
}