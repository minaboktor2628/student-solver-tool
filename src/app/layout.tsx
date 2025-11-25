import "@/styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import DevDock from "@/components/dev-dock";
import { auth } from "@/server/auth";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderBreadcrumbs } from "@/components/header-breadcrumbs";
import { ModeToggle } from "@/components/mode-toggle";
import { GlobalErrorBoundary } from "@/components/global-error-boundry";
import { GlobalSuspense } from "@/components/global-suspense";

export const metadata: Metadata = {
  title: "STS",
  description:
    "Student Teaching Staff - match WPI students assistants to classes",
  icons: [
    {
      rel: "icon",
      url: "/square-sigma.png",
    },
  ],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        <TooltipProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Toaster richColors toastOptions={{ duration: 5000 }} />
            <TRPCReactProvider>
              <SidebarProvider>
                <AppSidebar user={session?.user} />
                <SidebarInset>
                  <header className="flex h-16 w-full shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                      <SidebarTrigger className="-ml-1" />
                      <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                      />
                      <HeaderBreadcrumbs />
                    </div>
                    <div className="px-2">
                      <ModeToggle />
                    </div>
                  </header>
                  <div className="flex flex-1 flex-col">
                    <GlobalErrorBoundary>
                      <GlobalSuspense>{children}</GlobalSuspense>
                    </GlobalErrorBoundary>
                  </div>
                </SidebarInset>
                <DevDock />
              </SidebarProvider>
            </TRPCReactProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
