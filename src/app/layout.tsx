
import type { Metadata } from 'next';
import { Inter, Roboto_Mono, Wendy_One } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const roboto_mono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

const webSEOInformation = {
  title : "Day Weaver - Make Your Life Better",
  description : "Intelligently plan your day, manage tasks, and make your life better with Day Weaver",
  keywords : ["day planner", "task management", "productivity", "to-do list", "time management", "make life better"],
  url : "https://day-weaver-app.vercel.app",
  image : "https://placehold.co/600x400/7F55B1/FFE1E0?text=Day%20Weaver"
}

export const metadata: Metadata = {
  title: webSEOInformation.title,
  description: webSEOInformation.description,
  keywords: webSEOInformation.keywords,
  openGraph: {
    title: webSEOInformation.title,
    description: webSEOInformation.description,
    type: 'website',
    url: webSEOInformation.url,
    images: [
      {
        url: webSEOInformation.image,
        width: 1200,
        height: 630,
        alt: webSEOInformation.title,
      },
    ],
    siteName: 'Day Weaver',
  },
  twitter: {
    card: 'summary_large_image',
    title: webSEOInformation.title,
    description: webSEOInformation.description,
    images: [webSEOInformation.image],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto_mono.variable}`}>
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
