import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ProofPass — AI Content Passport",
  description:
    "Portable cryptographic provenance for AI-generated content. Every asset carries its proof.",
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
