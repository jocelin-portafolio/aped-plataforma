import { Camera } from 'lucide-react';
import { Section } from '@/components/ui';
import { GalleryGrid } from '@/components/features/gallery';

export default function GallerySection() {
  return (
    <Section
      id="gallery"
      eyebrow="Galería"
      eyebrowIcon={Camera}
      title="Nuestra comunidad en acción"
      subtitle="Momentos de los talleres y actividades de APED."
    >
      <GalleryGrid />
    </Section>
  );
}
