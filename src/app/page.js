import { homeJsonLd } from '@/lib/jsonld';
import JsonLd from '@/components/layout/JsonLd';
import HeroSection from '@/components/sections/HeroSection';
import MissionSection from '@/components/sections/MissionSection';
import ServicesPreview from '@/components/sections/ServicesPreview';
import WorkshopsPreview from '@/components/sections/WorkshopsPreview';
import GallerySection from '@/components/sections/GallerySection';
import CTASection from '@/components/sections/CTASection';

export const metadata = {
  title: 'Inicio',
  description:
    'APED ofrece servicios clínicos especializados y talleres grupales para personas con discapacidad. Reserva tu sesión o apóyanos con una donación.',
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <HeroSection />
      <MissionSection />
      <ServicesPreview />
      <WorkshopsPreview />
      <GallerySection />
      <CTASection />
    </>
  );
}
