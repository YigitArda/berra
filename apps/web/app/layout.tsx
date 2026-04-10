import type { Metadata } from 'next';
import { AppShell } from '../components/layout/app-shell';
import { Providers } from '../components/layout/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'arabalariseviyoruz.com - Türkiye\'nin Araba Topluluğu',
  description: 'Türkiye\'nin araba topluluğu: forum, feed, model merkezi, sanayi rehberi ve araç karşılaştırma.',
};

// Runtime API URL - build sonrası değiştirilebilir
const RUNTIME_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__API_BASE__ = "${RUNTIME_API_BASE}";`,
          }}
        />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('berra_theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
