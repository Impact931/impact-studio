import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieConsent from '@/components/layout/CookieConsent';
import CartDrawer from '@/components/layout/CartDrawer';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import SessionWrapper from '@/components/providers/SessionWrapper';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Impact Studio | Professional Studio & Equipment Rental',
  description:
    'Clarksville, TN\'s premier photography studio — cyclorama wall, professional lighting, and everything you need to create. Studio and equipment rental for photographers and creators.',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-brand-white font-sans text-brand-text antialiased">
        <SessionWrapper>
          <AuthProvider>
            <CartProvider>
              <Header />
              <CartDrawer />
              <main>{children}</main>
              <Footer />
              <CookieConsent />
            </CartProvider>
          </AuthProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
