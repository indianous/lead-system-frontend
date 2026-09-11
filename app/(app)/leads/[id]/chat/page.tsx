import { Heading, Text } from "base-ds";

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <Heading as="h1" size="xl">
        Conversa do lead
      </Heading>
      <Text color="muted">Permissão: VIEW_OWN_LEADS ou VIEW_ALL_LEADS</Text>
    </div>
  );
}
