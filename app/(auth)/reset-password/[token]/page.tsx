import { Heading, Text } from "base-ds";

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <Heading as="h1" size="xl">
        Redefinir senha
      </Heading>
      <Text color="muted">Permissão: — (pública, token de recuperação)</Text>
    </div>
  );
}
