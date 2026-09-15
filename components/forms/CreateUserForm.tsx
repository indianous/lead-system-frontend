"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, FormField, Input, PasswordInput, Select, Text } from "base-ds";
import { ApiError } from "@/lib/api-client";
import { useRoles } from "@/lib/queries/roles";
import { useCreateUser } from "@/lib/queries/users";

const createUserSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  roleId: z.string().min(1, "Selecione um papel"),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export function CreateUserForm() {
  const router = useRouter();
  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({ resolver: zodResolver(createUserSchema) });

  const roleOptions = (roles ?? []).map((role) => ({ value: role.id, label: role.name }));

  async function onSubmit(values: CreateUserFormValues) {
    try {
      await createUser.mutateAsync(values);
      router.push("/users");
    } catch {
      // erro exibido abaixo via createUser.error
    }
  }

  const submitError =
    createUser.error instanceof ApiError && createUser.error.status === 409
      ? "Já existe um usuário com esse e-mail"
      : createUser.error
        ? "Não foi possível criar o usuário"
        : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <FormField label="Nome" id="name" required error={errors.name?.message}>
        <Input id="name" state={errors.name ? "error" : "default"} {...register("name")} />
      </FormField>

      <FormField label="E-mail" id="email" required error={errors.email?.message}>
        <Input id="email" type="email" state={errors.email ? "error" : "default"} {...register("email")} />
      </FormField>

      <FormField label="Senha" id="password" required error={errors.password?.message}>
        <PasswordInput id="password" state={errors.password ? "error" : "default"} {...register("password")} />
      </FormField>

      <FormField label="Papel" id="roleId" required error={errors.roleId?.message}>
        <Select
          id="roleId"
          placeholder="Selecione um papel"
          options={roleOptions}
          state={errors.roleId ? "error" : "default"}
          {...register("roleId")}
        />
      </FormField>

      {submitError && (
        <Text color="destructive" role="alert">
          {submitError}
        </Text>
      )}

      <Button type="submit" isLoading={isSubmitting}>
        Criar usuário
      </Button>
    </form>
  );
}
