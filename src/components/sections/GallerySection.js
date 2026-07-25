import { Section } from '@/components/ui';
import { GalleryGrid } from '@/components/features/gallery';

export default function GallerySection() {
  return (
    <Section
      id="gallery"
      className="gallery"
      title="Nuestra Comunidad en Acción"
      subtitle="Momentos de los talleres y actividades de APED"
    >
      <GalleryGrid />
    </Section>
  );
}
