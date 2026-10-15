import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "theYapper — Your people. Your conversations.",
  description: "A home for your ideas, people, and conversations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}