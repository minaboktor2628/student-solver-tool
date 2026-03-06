"use client";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "../ui/sidebar";
import Link from "next/link";
import { allowedTree } from "@/lib/permissions";
import type { User } from "next-auth";

export function NavMain({ user }: { user: User | undefined }) {
  const pathname = usePathname();
  const links = user ? allowedTree(user) : [];

  return (
    <SidebarGroup>
      <SidebarMenu>
        {links.map((item) => (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              tooltip={item.label}
              isActive={pathname === item.href}
            >
              <Link href={item.href} className="font-medium">
                <item.icon />
                {item.label}
              </Link>
            </SidebarMenuButton>
            {item.children?.length ? (
              <SidebarMenuSub>
                {item.children.map((item) => (
                  <SidebarMenuSubItem key={item.label}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        {item.label}
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            ) : null}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
