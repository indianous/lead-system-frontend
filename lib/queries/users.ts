"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import type { CreateUserRequest, UpdateUserRequest, UserResponse } from "@/types/api";

export function useUsers() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<UserResponse[]>("/api/users", { token }),
    enabled: Boolean(token),
  });
}

export function useUser(id: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["users", id],
    queryFn: () => apiFetch<UserResponse>(`/api/users/${id}`, { token }),
    enabled: Boolean(token) && Boolean(id),
  });
}

export function useCreateUser() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateUserRequest) =>
      apiFetch<UserResponse>("/api/users", { method: "POST", body: request, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser(id: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateUserRequest) =>
      apiFetch<UserResponse>(`/api/users/${id}`, { method: "PUT", body: request, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
    },
  });
}
