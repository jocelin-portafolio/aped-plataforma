import { Users, ArrowRight } from 'lucide-react';
import { Section, Button } from '@/components/ui';
import { WorkshopCard } from '@/components/features/services';
import { workshops } from '@/config/workshops';

export default function WorkshopsPreview() {
  return (
    <Section
      id="workshops-preview"
      tinted
      eyebrow="Talleres grupales"
      eyebrowIcon={Users}
      title="Aprender y compartir, cada sábado"
      subtitle="Talleres en grupos pequeños para desarrollar habilidades y hacer comunidad."
    >
      <div className="card-grid" role="list">
        {workshops.map((w) => (
          <WorkshopCard key={w.id} workshop={w} />
        ))}
      </div>
      <div className="section-footer">
        <Button href="/talleres" variant="ghost">
          Ver todos los talleres
          <ArrowRight size={18} aria-hidden="true" />
        </Button>
      </div>
    </Section>
  );
}
