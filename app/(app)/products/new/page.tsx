import { Heading } from "base-ds";
import { CreateProductForm } from "@/components/forms/CreateProductForm";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-4 max-w-md">
      <Heading as="h1" size="xl">
        Novo produto
      </Heading>
      <CreateProductForm />
    </div>
  );
}
