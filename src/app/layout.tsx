import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ROAST ARENA — Internet Gladiator Battle",
  description: "The ultimate multiplayer AI roast battle platform. Watch YouTube Shorts together, roast your opponent in real-time, and let the AI judge destroy you both. Every battle creates viral clips.",
  keywords: ["roast battle", "multiplayer", "AI judge", "youtube shorts", "reaction", "viral clips"],
  openGraph: {
    title: "ROAST ARENA",
    description: "Sync. Roast. Destroy. The internet's most savage battle platform.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-arena-black text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
