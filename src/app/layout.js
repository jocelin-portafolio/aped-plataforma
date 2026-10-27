import { Nunito } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ChatWidget } from '@/components/features/chat';
import './globals.css';

// Tipografía redondeada y muy legible, alojada por Next (sin pedir a Google en cada visita).
const nunito = Nunito({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });

export const metadata = {
  title: {
    default: 'APED - Agrupación Personas Empoderadas por la Discapacidad',
    template: '%s | APED',
  },
  description:
    'Servicios clínicos de terapia ocupacional, fonoaudiología, terapia conductual, psicología y talleres grupales para personas con discapacidad.',
  keywords: [
    'discapacidad',
    'terapia ocupacional',
    'fonoaudiología',
    'terapia conductual',
    'psicología',
    'talleres',
    'inclusión',
  ],
  icons: { icon: '/images/logo.jpeg' },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'APED',
  },
};

export const viewport = { themeColor: '#2337c6' };

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={nunito.variable}>
      <body>
        <a href="#main-content" className="skip-link">
          Saltar al contenido
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}
