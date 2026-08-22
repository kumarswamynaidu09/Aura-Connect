import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

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
      <body className="bg-[#09090b] text-[#ededed] min-h-screen selection:bg-monad-500/30 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
