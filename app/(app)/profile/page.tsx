import { Heading, Text } from "base-ds";

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <Heading as="h1" size="xl">
        Meu perfil
      </Heading>
      <Text color="muted">Permissão: —</Text>
    </div>
  );
}
