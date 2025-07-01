import type { Metadata } from 'next';
import { Belleza, Literata } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const bellezaFont = Belleza({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-belleza',
  display: 'swap',
});

const literataFont = Literata({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-literata',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BookWise Companion',
  description: 'Your intelligent book reading assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          'font-body antialiased',
          bellezaFont.variable,
          literataFont.variable
        )}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
