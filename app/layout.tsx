import type { Metadata, Viewport } from "next";
import "./globals.css";
import FamilySyncProvider from "@/components/FamilySyncProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "週末ナビ｜家族でどこ行く？",
  description:
    "気分と天気と家族構成をタップするだけで、今週末の行き先を3〜5件提案します。名古屋圏対応。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "週末ナビ",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#FB923C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full antialiased">
        <div className="mx-auto max-w-md min-h-screen flex flex-col">
          <FamilySyncProvider>{children}</FamilySyncProvider>
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
