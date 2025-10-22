"use client";

import { usePathname } from "next/navigation";
import { SquareSigma } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { allowedTree } from "@/lib/permissions";
import type { User } from "next-auth";

export function AppSidebar({ user }: { user: User | undefined }) {
  const links = user ? allowedTree(user) : [];
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Link href={"/"}>
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <SquareSigma className="size-4" />
              </div>
              <span className="truncate font-medium">STS</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {links.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild tooltip={item.label}>
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
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
