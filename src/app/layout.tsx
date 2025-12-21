import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Waldwirtschaft Heidekönig Reservierungen',
  description: 'Digitale Anfragen & Adminpanel für Reservierungen',
  icons: {
    icon: '/HK_FAVI.png',
    shortcut: '/HK_FAVI.png',
    apple: '/HK_FAVI.png'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
