"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  FormField,
  Input,
  PasswordInput,
  Text,
} from "base-ds";

const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setLoginError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setLoginError("E-mail ou senha inválidos");
      return;
    }

    router.push("/");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormField
        label="E-mail"
        id="email"
        required
        error={errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          state={errors.email ? "error" : "default"}
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Senha"
        id="password"
        required
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          state={errors.password ? "error" : "default"}
          {...register("password")}
        />
      </FormField>

      {loginError && (
        <Text color="destructive" role="alert">
          {loginError}
        </Text>
      )}

      <Button type="submit" isLoading={isSubmitting}>
        Entrar
      </Button>
    </form>
  );
}
