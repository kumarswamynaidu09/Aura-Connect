import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AURA CONNECT — Sovereign AI Context & Memory Protocol on Monad",
  description:
    "Own, monetize, and permission your AI memory across applications via Monad high-throughput EVM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#0A0A0F] text-[#F5F5F7] min-h-screen selection:bg-[#FF8A00]/30 selection:text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
