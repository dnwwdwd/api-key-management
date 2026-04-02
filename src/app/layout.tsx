import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Api Key管理",
  description: "Local-first API key manager for developers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-950">
        {children}
      </body>
    </html>
  );
}