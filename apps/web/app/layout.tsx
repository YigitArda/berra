import type { Metadata } from 'next';
import { AppShell } from '../components/layout/app-shell';
import { Providers } from '../components/layout/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'berra web',
  description: 'Yeni Next.js tabanlı arayüz migration iskeleti',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
