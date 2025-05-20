
import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'Day Weaver - Make Your Life Better',
  description: 'Intelligently plan your day, manage tasks, and make your life better with Day Weaver, your AI-powered day planner.',
  keywords: ['day planner', 'task management', 'productivity', 'AI planner', 'schedule', 'to-do list', 'time management', 'make life better'],
  openGraph: {
    title: 'Day Weaver - Make Your Life Better',
    description: 'Intelligently plan your day, manage tasks, and improve your productivity with Day Weaver.',
    type: 'website',
    url: 'https://your-app-url.com', // Replace with your actual app URL
    images: [
      {
        url: 'https://placehold.co/1200x630.png', // Replace with your actual OG image URL
        width: 1200,
        height: 630,
        alt: 'Day Weaver - AI Powered Day Planner',
      },
    ],
    siteName: 'Day Weaver',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Day Weaver - Make Your Life Better',
    description: 'Intelligently plan your day, manage tasks, and improve your productivity with Day Weaver.',
    // creator: '@yourTwitterHandle', // Optional: Replace with your Twitter handle
    images: ['https://placehold.co/1200x600.png'], // Replace with your actual Twitter card image URL
  },
  robots: { // Added robots for SEO
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
  // Optional: Add more metadata like icons, manifest, etc.
  // icons: {
  //   icon: '/favicon.ico',
  //   apple: '/apple-touch-icon.png',
  // },
  // manifest: '/site.webmanifest',
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
