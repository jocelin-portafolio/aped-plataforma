import { Stethoscope, ArrowRight } from 'lucide-react';
import { Section, Button } from '@/components/ui';
import { ServiceCard } from '@/components/features/services';
import { clinicalServices } from '@/config/services';

export default function ServicesPreview() {
  return (
    <Section
      id="services-preview"
      tinted
      eyebrow="Servicios clínicos"
      eyebrowIcon={Stethoscope}
      title="Terapias individuales con especialistas"
      subtitle="Sesiones 1 a 1, de lunes a sábado, con un plan para cada persona."
    >
      <div className="card-grid" role="list">
        {clinicalServices.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
      <div className="section-footer">
        <Button href="/servicios-clinicos" variant="ghost">
          Ver servicios y horarios
          <ArrowRight size={18} aria-hidden="true" />
        </Button>
      </div>
    </Section>
  );
}
