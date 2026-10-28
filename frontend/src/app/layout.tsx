import "./globals.css";
import "./responsive-screen.css";
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
      <body suppressHydrationWarning><AppLayout>{children}</AppLayout></body>
    </html>
  );
}
