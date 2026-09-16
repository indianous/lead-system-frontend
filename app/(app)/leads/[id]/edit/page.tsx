import { Heading } from "base-ds";
import { EditLeadForm } from "@/components/forms/EditLeadForm";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <Heading as="h1" size="xl">
        Editar lead
      </Heading>
      <EditLeadForm leadId={id} />
    </div>
  );
}
