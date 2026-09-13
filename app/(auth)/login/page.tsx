import { Heading } from "base-ds";
import { LoginForm } from "@/components/forms/LoginForm";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Heading as="h1" size="xl">
          Login
        </Heading>
      </div>

      <LoginForm />
    </div>
  );
}
