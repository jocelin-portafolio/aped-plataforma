import { Section } from '@/components/ui';
import { WorkshopCard } from '@/components/features/services';
import { workshops } from '@/config/workshops';

export const metadata = {
  title: 'Talleres',
  description:
    'Talleres grupales de Habilidades Sociales, Arteterapia, Cocina y Motricidad. Solo sábados, con aforo limitado.',
};

export default function WorkshopsPage() {
  return (
    <Section
      id="workshops"
      className="workshops-page"
      title="Talleres Grupales"
      subtitle="Solo sábados - Cupos limitados"
    >
      <div className="card-grid" role="list">
        {workshops.map((ws) => (
          <WorkshopCard key={ws.id} workshop={ws} />
        ))}
      </div>
    </Section>
  );
}
