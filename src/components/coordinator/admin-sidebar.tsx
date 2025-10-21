"use client";

import { usePathname } from "next/navigation";
import {
  ScanFace,
  ChartSpline,
  Computer,
  type LucideProps,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import type { Route } from "next";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

type SidebarItem = {
  title: string;
  url: Route;
  description?: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
};

const items: SidebarItem[] = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: ChartSpline,
    description: "Coordinator overview/panel",
  },
  {
    title: "Permissions",
    url: "/dashboard/permissions",
    icon: ScanFace,
    description:
      "Set the permitted TAs/PLAs/Professors that are allowed to sign into STS",
  },
  {
    title: "Solver",
    url: "/dashboard/solver",
    icon: Computer,
    description:
      "Match students assistants to classes using their and the professor's preferences",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="pt-16">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    title={item.description}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
