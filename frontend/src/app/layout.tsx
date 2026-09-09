import type { Metadata } from "next";
import AppLayout from "@/components/shell/AppLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digitopper Project Tracker",
  description: "Enterprise Project Control Center"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppLayout>{children}</AppLayout></body>
    </html>
  );
}
