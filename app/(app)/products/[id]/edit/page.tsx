import { Heading } from "base-ds";
import { EditProductForm } from "@/components/forms/EditProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <Heading as="h1" size="xl">
        Editar produto
      </Heading>
      <EditProductForm productId={id} />
    </div>
  );
}
