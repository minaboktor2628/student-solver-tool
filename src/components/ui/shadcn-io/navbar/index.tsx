"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export interface NavbarNavItem {
  href: Route;
  label: string;
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo: React.ReactNode;
  navigationLinks: NavbarNavItem[];
  authSlot?: React.ReactNode;
}

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ className, logo, authSlot, navigationLinks, ...props }, ref) => {
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLElement>(null);
    const pathname = usePathname();

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setIsMobile(width < 768); // 768px is md breakpoint
        }
      };

      checkWidth();

      const resizeObserver = new ResizeObserver(checkWidth);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Is link active?
    const isActive = (href: string) => {
      if (href === pathname) return true;
      return href !== "/" && pathname.startsWith(href); // All routes will begin with "/"
    };

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    return (
      <header
        ref={combinedRef}
        className={cn(
          "bg-background/95 supports-[backdrop-filter]:bg-background/60 fixed top-0 z-50 w-full border-b px-4 backdrop-blur md:px-6 [&_*]:no-underline",
          className,
        )}
        {...props}
      >
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="group hover:bg-accent hover:text-accent-foreground h-9 w-9"
                    variant="ghost"
                    size="icon"
                  >
                    <Menu />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-1">
                  <NavigationMenu className="max-w-none">
                    <NavigationMenuList className="flex-col items-start gap-0">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem key={index} className="w-full">
                          <NavigationMenuLink asChild>
                            <Link href={link.href}>{link.label}</Link>
                          </NavigationMenuLink>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            )}
            {/* Main nav */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-primary hover:text-primary/90 flex cursor-pointer items-center space-x-2 transition-colors"
              >
                <div className="text-2xl">{logo}</div>
                <span className="hidden text-xl font-bold sm:inline-block">
                  SST
                </span>
              </Link>
              {/* Navigation menu */}
              {!isMobile && (
                <NavigationMenu className="flex">
                  <NavigationMenuList className="gap-1">
                    {navigationLinks.map((link, index) => (
                      <NavigationMenuItem key={index}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={link.href}
                            className={cn(
                              "relative inline-flex h-10 cursor-pointer items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                              "hover:text-primary/90",
                              // underline animation
                              "before:bg-primary before:absolute before:right-0 before:bottom-0 before:left-0 before:h-0.5 before:scale-x-0 before:transition-transform before:duration-300 hover:before:scale-x-100",
                              isActive(link.href) && "before:scale-x-100",
                            )}
                          >
                            {link.label}
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              )}
            </div>
          </div>
          {/* Right side */}
          <div className="flex items-center gap-3">
            {authSlot}
            <ModeToggle />
          </div>
        </div>
      </header>
    );
  },
);

Navbar.displayName = "Navbar";
