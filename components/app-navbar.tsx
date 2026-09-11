import { Navbar, Text } from "base-ds";
import { LogoutButton } from "@/components/logout-button";

export function AppNavbar() {
  return (
    <Navbar
      logo={
        <Text as="span" weight="semibold">
          Lead System
        </Text>
      }
      actions={[<LogoutButton key="logout" />]}
      sticky
    />
  );
}
