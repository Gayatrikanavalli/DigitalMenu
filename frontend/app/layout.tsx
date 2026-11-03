import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BhojanQR – Restaurant Digital Menu & QR Order System',
  description: 'Premium restaurant digital menu and QR-based ordering web application with customer ordering, kitchen display, and table QR management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#FBFBF9] text-stone-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
