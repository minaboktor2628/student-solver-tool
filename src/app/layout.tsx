import "@/styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { Navbar, type NavbarNavItem } from "@/components/ui/shadcn-io/navbar";
import { Calculator } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthButton } from "@/components/auth-button";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "SST",
  description: "Student Solver Tool - match WPI students assistants to classes",
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

const links: NavbarNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/validate", label: "Validate" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body className="flex h-dvh flex-col">
        <TooltipProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Toaster richColors toastOptions={{ duration: 5000 }} />
            <TRPCReactProvider>
              <Navbar
                logo={<Calculator />}
                navigationLinks={links}
                authSlot={<AuthButton />}
                className="shrink-0"
              />
              <main className="min-h-0 flex-1">{children}</main>
            </TRPCReactProvider>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
