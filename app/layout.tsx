import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Dashboard Analytics',
  description:
    'Plataforma completa de business intelligence com visualizações interativas e análise de dados em tempo real',
};

import { SocketProvider } from './providers/SocketProvider';
import { ThemeProvider } from './providers/ThemeProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <SocketProvider>{children}</SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
