import { api } from "@/api/client";
import type { Product } from "@/types/domain";

export interface ProductRequest {
  description: string;
  accountId: string;
  isActive: boolean;
}

export const productsApi = {
  list: () => api.get<Product[]>("/products"),
  get: (id: string) => api.get<Product>(`/products/${id}`),
  create: (request: ProductRequest) => api.post<Product>("/products", request),
  update: (id: string, request: ProductRequest) => api.put<Product>(`/products/${id}`, request),
  deactivate: (id: string) => api.delete<void>(`/products/${id}`),
};
