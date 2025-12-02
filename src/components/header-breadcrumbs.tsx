"use client";

import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import type { Route } from "next";

export function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const last = segments.at(-1) ?? "";
  const parents = segments.slice(0, -1);

  const hrefFor = (i: number) =>
    ("/" + segments.slice(0, i + 1).join("/")) as Route;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {parents.map((seg, i) => (
          <BreadcrumbItem key={hrefFor(i)} className="hidden md:block">
            <BreadcrumbLink asChild>
              <Link href={hrefFor(i)}>{seg}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}

        {parents.length > 0 && (
          <BreadcrumbSeparator className="hidden md:block" />
        )}

        <BreadcrumbItem>
          <BreadcrumbPage>{last || "Home"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
