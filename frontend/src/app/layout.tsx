import "./globals.css";
import type { Metadata } from "next";
import AppLayout from "@/components/shell/AppLayout";

export const metadata: Metadata = {
  title: "Digitopper Project Tracker",
  description: "Enterprise Project Control Center"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body><AppLayout>{children}</AppLayout></body>
    </html>
  );
}
