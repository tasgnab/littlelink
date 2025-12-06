import type { Metadata } from "next";
import "./globals.css";
import { clientConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: clientConfig.title,
  description: clientConfig.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
