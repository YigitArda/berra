import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'berra web',
  description: 'Yeni Next.js tabanlı arayüz migration iskeleti',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
