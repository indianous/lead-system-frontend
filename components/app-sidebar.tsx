"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "base-ds";
import { Icon } from "base-ds";
import { NAV_ITEMS } from "@/lib/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  const items = NAV_ITEMS.map((item) => ({
    label: item.label,
    icon: <Icon name={item.icon} size="sm" />,
    active: item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    asChild: <Link href={item.href}>{null}</Link>,
  }));

  return <Sidebar items={items} />;
}
