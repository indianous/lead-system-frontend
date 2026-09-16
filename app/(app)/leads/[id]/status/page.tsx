import { Heading } from "base-ds";
import { UpdateLeadStatusForm } from "@/components/forms/UpdateLeadStatusForm";

export default async function LeadStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <Heading as="h1" size="xl">
        Mudar etapa / marcar perdido
      </Heading>
      <UpdateLeadStatusForm leadId={id} />
    </div>
  );
}
