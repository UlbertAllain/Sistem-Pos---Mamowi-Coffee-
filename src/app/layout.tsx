import type { Metadata } from 'next';
import './globals.css';
import './tactile.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: { default: 'Mamowi Coffee POS', template: '%s | Mamowi Coffee POS' },
  description: 'Sistem point of sale Mamowi Coffee.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
