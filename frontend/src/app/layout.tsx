import "./globals.css";
import type { Metadata } from "next";
import AppLayout from "@/components/shell/AppLayout";

export const metadata: Metadata = {
  title: "DigiToppers Project Tracker",
  description: "Enterprise Project Control Center",
  icons: {
    icon: "/digitoppers-icon.png",
    shortcut: "/digitoppers-icon.png",
    apple: "/digitoppers-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/digitoppers-icon.png" sizes="any" />
        <link rel="apple-touch-icon" href="/digitoppers-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning><AppLayout>{children}</AppLayout></body>
    </html>
  );
}
