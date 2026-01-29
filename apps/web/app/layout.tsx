import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata() {
  const t = await getTranslations();
  
  return {
    title: "Brute Force AI - Global Social Hacking Simulation",
    description: "Crack password and take the prize. A global social hacking simulation where everyone targets the same block.",
    openGraph: {
      title: "Brute Force AI - Global Social Hacking Simulation",
      description: "Crack the password and take the prize. A global social hacking simulation where everyone targets the same block.",
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
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}