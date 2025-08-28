import "@/styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { Navbar, type NavbarNavItem } from "@/components/ui/shadcn-io/navbar";
import { Calculator } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "SST",
  description: "Student Solver Tool - match WPI students assistants to classes",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster />
          <TRPCReactProvider>
            <Navbar logo={<Calculator />} navigationLinks={links} />
            {children}
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
