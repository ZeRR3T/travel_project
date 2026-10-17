import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toast } from '@/components/Toast';
import { I18nProvider } from '@/i18n/context/I18nContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TravelWorld',
  description: 'Your one-stop travel booking platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50`}>
        <I18nProvider>
          <Providers>
            <Toast />
            {children}
            <div id="modal-portal"></div>
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
