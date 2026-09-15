"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api-client";
import type { RoleResponse } from "@/types/api";

export function useRoles() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["roles"],
    queryFn: () => apiFetch<RoleResponse[]>("/api/roles", { token }),
    enabled: Boolean(token),
  });
}
