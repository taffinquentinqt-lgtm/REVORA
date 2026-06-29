import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Nav } from "@/components/ui/Nav";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/components/AuthProvider";
import { SITE_URL } from "@/lib/site";

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

const DESCRIPTION =
  "Charge ton CSV. REVORA te dit qui appeler, quoi dire, et ce qu'il ne faut pas rater. Un brief opérationnel par lead B2B.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "REVORA — Sales intelligence B2B",
    template: "%s · REVORA",
  },
  description: DESCRIPTION,
  applicationName: "REVORA",
  keywords: [
    "sales intelligence",
    "prospection B2B",
    "scoring de leads",
    "SDR",
    "cold call",
    "ICP",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "REVORA",
    title: "REVORA — Sales intelligence B2B",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "REVORA — Sales intelligence B2B",
    description: DESCRIPTION,
  },
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
        <Analytics />
      </body>
    </html>
  );
}
