import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { TicketsPlane } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Do I Need a Visa?",
  description:
    "Check Visa Requirements for International Travel | Instantly find out if you need a visa to visit any country worldwide and plan out your next trips smoothly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="px-4 max-w-3xl mx-auto flex flex-col h-full">
            <header className="flex py-6 gap-3 justify-between items-center text-white">
              <SiteHeader />
              <div className="fantano">
                <TicketsPlane />
              </div>
            </header>
            {children}
            <footer className="text-xs text-center py-5 text-neutral-600">
              Disclaimer: This is a personal project and not an official source
              of immigration advice. <br /> Please consult official government
              websites for the most accurate and up-to-date information.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
