import type { UserRole } from "@/src/features/auth/auth.types";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserRequest = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type UpdateUserRequest = {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
};

export type UpdateUserStatusRequest = {
  isActive: boolean;
};
