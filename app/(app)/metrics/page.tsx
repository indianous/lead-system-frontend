import { Heading, Text } from "base-ds";

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <Heading as="h1" size="xl">
        Métricas do funil
      </Heading>
      <Text color="muted">Permissão: VIEW_METRICS</Text>
    </div>
  );
}
