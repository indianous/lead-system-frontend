import { Heading, Text } from "base-ds";

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <Heading as="h1" size="xl">
        Definir senha (convite)
      </Heading>
      <Text color="muted">Permissão: — (pública, token de convite)</Text>
    </div>
  );
}
