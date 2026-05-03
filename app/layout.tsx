import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workplan Clarifier",
  description: "Turn unclear planning language into structured goals, strategies, and measurable outcomes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
