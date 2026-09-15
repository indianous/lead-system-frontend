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
