import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "regenerator-runtime/runtime";
import I18nProvider from "@/components/I18nProvider";
import FarmingBackground from "@/components/FarmingBackground";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Farmer Sahayak - AI Agricultural Advisor",
  description: "Multilingual AI advisory system for farmers in India",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <FarmingBackground />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
