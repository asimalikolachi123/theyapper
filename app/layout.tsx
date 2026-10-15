import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "theYapper — Better conversations", template: "%s · theYapper" },
  description: "Find your people through ideas, thoughtful conversations and Topic Circles.",
  applicationName: "theYapper",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "theYapper" },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#6759e8" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
