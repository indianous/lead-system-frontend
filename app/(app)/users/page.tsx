"use client";

import Link from "next/link";
import { Badge, Button, Heading, Skeleton, Table } from "base-ds";
import type { TableColumn } from "base-ds";
import { Text } from "base-ds";
import { ApiError } from "@/lib/api-client";
import { useUsers } from "@/lib/queries/users";
import type { UserResponse } from "@/types/api";

const columns: TableColumn<UserResponse>[] = [
  { key: "name", header: "Nome" },
  { key: "email", header: "E-mail" },
  { key: "roleName", header: "Papel" },
  {
    key: "active",
    header: "Status",
    render: (row) => (
      <Badge variant={row.active ? "success" : "default"}>{row.active ? "Ativo" : "Inativo"}</Badge>
    ),
  },
  {
    key: "id",
    header: "Ações",
    render: (row) => (
      <Link href={`/users/${row.id}/edit`} className="text-sm text-primary">
        Editar
      </Link>
    ),
  },
];

export default function UsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const isForbidden = error instanceof ApiError && error.status === 403;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Heading as="h1" size="xl">
          Usuários
        </Heading>
        <Button asChild>
          <Link href="/users/new">Novo usuário</Link>
        </Button>
      </div>

      {isLoading && <Skeleton height={200} />}

      {isForbidden && (
        <Text color="destructive" role="alert">
          Você não tem permissão para ver esta página
        </Text>
      )}

      {users && <Table columns={columns} data={users} caption="Lista de usuários" />}
    </div>
  );
}
