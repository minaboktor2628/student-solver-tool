import "@/styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/ui/shadcn-io/navbar";
import { Calculator } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthButton } from "@/components/auth-button";
import { TooltipProvider } from "@/components/ui/tooltip";
import DevDock from "@/components/dev-dock";
import { RootProvider } from "fumadocs-ui/provider";
import { allowedLinks } from "@/server/auth/permissions";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "STS",
  description:
    "Student Teaching Staff - match WPI students assistants to classes",
  icons: [
    {
      rel: "icon",
      url: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNhbGN1bGF0b3ItaWNvbiBsdWNpZGUtY2FsY3VsYXRvciI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjIwIiB4PSI0IiB5PSIyIiByeD0iMiIvPjxsaW5lIHgxPSI4IiB4Mj0iMTYiIHkxPSI2IiB5Mj0iNiIvPjxsaW5lIHgxPSIxNiIgeDI9IjE2IiB5MT0iMTQiIHkyPSIxOCIvPjxwYXRoIGQ9Ik0xNiAxMGguMDEiLz48cGF0aCBkPSJNMTIgMTBoLjAxIi8+PHBhdGggZD0iTTggMTBoLjAxIi8+PHBhdGggZD0iTTEyIDE0aC4wMSIvPjxwYXRoIGQ9Ik04IDE0aC4wMSIvPjxwYXRoIGQ9Ik0xMiAxOGguMDEiLz48cGF0aCBkPSJNOCAxOGguMDEiLz48L3N2Zz4=",
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
      <body className="flex h-screen flex-col">
        <TooltipProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Toaster richColors toastOptions={{ duration: 5000 }} />
            <TRPCReactProvider>
              <RootProvider>
                <Navbar
                  logo={<Calculator />}
                  navigationLinks={allowedLinks(session?.user)}
                  authSlot={<AuthButton />}
                  className="shrink-0"
                />
                <main className="flex-1 overflow-auto pt-16">{children}</main>
                <DevDock />
              </RootProvider>
            </TRPCReactProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
