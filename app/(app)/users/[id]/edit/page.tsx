import { Heading } from "base-ds";
import { EditUserForm } from "@/components/forms/EditUserForm";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <Heading as="h1" size="xl">
        Editar usuário
      </Heading>
      <EditUserForm userId={id} />
    </div>
  );
}
