import { Icon } from "base-ds";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof Icon>["name"];

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Funil", href: "/leads", icon: "KanbanSquare" },
  { label: "Inbox", href: "/inbox", icon: "Inbox" },
  { label: "Prospecção", href: "/prospecting", icon: "Search" },
  { label: "Produtos", href: "/products", icon: "Package" },
  { label: "Usuários", href: "/users", icon: "Users" },
  { label: "Métricas", href: "/metrics", icon: "BarChart3" },
  { label: "Perfil", href: "/profile", icon: "User" },
];
