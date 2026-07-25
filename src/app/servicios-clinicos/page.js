import { clinicalServicesJsonLd } from '@/lib/jsonld';
import JsonLd from '@/components/layout/JsonLd';
import { Section } from '@/components/ui';
import { ServiceCard } from '@/components/features/services';
import { BookingForm, ScheduleTable } from '@/components/features/booking';
import { clinicalServices } from '@/config/services';

export const metadata = {
  title: 'Servicios Clínicos',
  description:
    'Terapia Ocupacional, Fonoaudiología, Terapia Conductual y Psicología. Atención personalizada de lunes a sábado.',
};

export default function ClinicalServicesPage() {
  return (
    <>
      <JsonLd data={clinicalServicesJsonLd()} />
      <Section
        id="services"
        className="services-page"
        title="Servicios Clínicos"
        subtitle="Atención personalizada de lunes a sábado"
      >
        <div className="card-grid" role="list">
          {clinicalServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </Section>
      <ScheduleTable />
      <BookingForm />
    </>
  );
}
