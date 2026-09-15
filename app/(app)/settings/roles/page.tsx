"use client";

import { Badge, Card, Heading, Skeleton, Text } from "base-ds";
import { ApiError } from "@/lib/api-client";
import { useRoles } from "@/lib/queries/roles";

export default function RolesPage() {
  const { data: roles, isLoading, error } = useRoles();
  const isForbidden = error instanceof ApiError && error.status === 403;

  return (
    <div className="flex flex-col gap-4">
      <Heading as="h1" size="xl">
        Papéis e permissões
      </Heading>

      {isLoading && <Skeleton height={200} />}

      {isForbidden && (
        <Text color="destructive" role="alert">
          Você não tem permissão para ver esta página
        </Text>
      )}

      {roles?.map((role) => (
        <Card
          key={role.id}
          header={
            <Heading as="h2" size="xl">
              {role.name}
            </Heading>
          }
        >
          <div className="flex flex-col gap-2">
            {role.description && <Text color="muted">{role.description}</Text>}
            <div className="flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <Badge key={permission}>{permission}</Badge>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
