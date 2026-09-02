import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Falcon - Intelligent Startpage & Daily Trivia Hub',
  description: 'Minimalist, eye-comfort startpage featuring smart web search, customizable speed dial shortcuts, and daily refreshing trivia challenges.',
  keywords: ['Falcon Startpage', 'Web Search', 'Daily Trivia', 'Web Shortcuts', 'Productivity Dashboard', 'Minimalist Startpage'],
  authors: [{ name: 'Falcon Team' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f17',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
