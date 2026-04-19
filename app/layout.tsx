import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "REVORA",
  description: "Analyse commerciale de leads B2B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}