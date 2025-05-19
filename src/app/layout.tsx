import type {Metadata} from 'next';
import { Inter, Roboto_Mono } from 'next/font/google'; // Updated font imports
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: '--font-inter', // Updated variable name
  subsets: ['latin'],
});

const roboto_mono = Roboto_Mono({ // Updated font
  variable: '--font-roboto-mono', // Updated variable name
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Day Weaver - AI Powered Day Planner',
  description: 'Plan your day intelligently with Day Weaver.',
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
