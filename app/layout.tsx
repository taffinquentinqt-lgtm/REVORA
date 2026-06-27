import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/ui/Nav";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "REVORA — Sales intelligence B2B",
  description:
    "Charge ton CSV. REVORA te dit qui appeler, quoi dire, et ce qu'il ne faut pas rater.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-bg text-ink">
        <ToastProvider>
          <AuthProvider>
            <Nav />
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
