"use client";

import { signOut } from "next-auth/react";
import { Button, Icon } from "base-ds";

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      aria-label="Sair"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <Icon name="LogOut" size="sm" />
    </Button>
  );
}
