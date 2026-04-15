import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kapido | Ride Gap Intelligence",
  description: "Predict ride demand-supply gaps and visualize shortage zones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full w-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full w-full flex flex-col overflow-x-hidden bg-kapido-bg text-kapido-text">{children}</body>
    </html>
  );
}
