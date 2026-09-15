export interface UserResponse {
  id: string;
  name: string;
  email: string;
  roleName: string;
  active: boolean;
  createdAt: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roleId: string;
}

export interface UpdateUserRequest {
  name: string;
  roleId: string;
  active: boolean;
}

export type ProductType = "READY_MADE" | "CUSTOM";

export interface ProductResponse {
  id: string;
  name: string;
  type: ProductType;
  description: string | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  active: boolean;
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  type: ProductType;
  description: string | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
}

export interface UpdateProductRequest {
  name: string;
  type: ProductType;
  description: string | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  active: boolean;
}
