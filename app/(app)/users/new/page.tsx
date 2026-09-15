import { Heading } from "base-ds";
import { CreateUserForm } from "@/components/forms/CreateUserForm";

export default function NewUserPage() {
  return (
    <div className="flex flex-col gap-4 max-w-md">
      <Heading as="h1" size="xl">
        Novo usuário
      </Heading>
      <CreateUserForm />
    </div>
  );
}
