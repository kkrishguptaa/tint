import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tint — couple intimacy map",
  description:
    "Swipe through intimacy dimensions together, then see where you align.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
