"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, Select, Skeleton, Switch, Text } from "base-ds";
import { useRoles } from "@/lib/queries/roles";
import { useUpdateUser, useUser } from "@/lib/queries/users";

const editUserSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  roleId: z.string().min(1, "Selecione um papel"),
  active: z.boolean(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export function EditUserForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: user, isLoading } = useUser(userId);
  const { data: roles } = useRoles();
  const updateUser = useUpdateUser(userId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: "", roleId: "", active: true },
  });

  useEffect(() => {
    if (!user || !roles) {
      return;
    }
    const role = roles.find((candidate) => candidate.name === user.roleName);
    reset({ name: user.name, roleId: role?.id ?? "", active: user.active });
  }, [user, roles, reset]);

  const roleOptions = (roles ?? []).map((role) => ({ value: role.id, label: role.name }));

  async function onSubmit(values: EditUserFormValues) {
    try {
      await updateUser.mutateAsync(values);
      router.push("/users");
    } catch {
      // erro exibido abaixo via updateUser.error
    }
  }

  if (isLoading) {
    return <Skeleton height={200} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormField label="Nome" id="name" required error={errors.name?.message}>
        <Input id="name" state={errors.name ? "error" : "default"} {...register("name")} />
      </FormField>

      <FormField label="Papel" id="roleId" required error={errors.roleId?.message}>
        <Select
          id="roleId"
          options={roleOptions}
          state={errors.roleId ? "error" : "default"}
          {...register("roleId")}
        />
      </FormField>

      <Controller
        control={control}
        name="active"
        render={({ field }) => (
          <Switch id="active" label="Ativo" checked={field.value} onChange={field.onChange} />
        )}
      />

      {updateUser.isError && (
        <Text color="destructive" role="alert">
          Não foi possível atualizar o usuário
        </Text>
      )}

      <Button type="submit" isLoading={isSubmitting}>
        Salvar alterações
      </Button>
    </form>
  );
}
