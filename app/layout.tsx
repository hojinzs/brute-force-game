import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brute Force AI - Global Social Hacking Simulation",
  description:
    "Crack the password and take the prize. A global social hacking simulation where everyone targets the same block.",
  openGraph: {
    title: "Brute Force AI - Global Social Hacking Simulation",
    description:
      "Crack the password and take the prize. A global social hacking simulation where everyone targets the same block.",
    siteName: "Brute Force AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Brute Force AI Game Interface",
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
