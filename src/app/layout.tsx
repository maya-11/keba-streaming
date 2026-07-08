import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { ServiceWorkerRegister } from '@/components/pwa/sw-register';
import './globals.css';

export const metadata: Metadata = {
  title: 'Keba Streaming',
  description: 'Watch movies, series, and more on Keba Streaming',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-512x512.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
            },
          }}
        />
      </body>
    </html>
  );
}
