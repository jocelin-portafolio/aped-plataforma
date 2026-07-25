import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

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
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'APED',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
