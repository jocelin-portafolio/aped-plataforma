import { Stethoscope, Clock, UserRound, MapPin, CalendarCheck, CalendarClock } from 'lucide-react';
import { clinicalServicesJsonLd } from '@/lib/jsonld';
import JsonLd from '@/components/layout/JsonLd';
import { Section } from '@/components/ui';
import PageHero from '@/components/sections/PageHero';
import { ServiceCard } from '@/components/features/services';
import { BookingForm, ScheduleTable } from '@/components/features/booking';
import { clinicalServices } from '@/config/services';
import { contact } from '@/config/navigation';

export const metadata = {
  title: 'Servicios Clínicos',
  description:
    'Terapia Ocupacional, Fonoaudiología, Terapia Conductual y Psicología. Atención personalizada de lunes a sábado.',
};

export default function ClinicalServicesPage() {
  return (
    <>
      <JsonLd data={clinicalServicesJsonLd()} />
      <PageHero
        eyebrow="Servicios clínicos"
        eyebrowIcon={Stethoscope}
        title="Terapias con especialistas, a tu ritmo"
        lead="Sesiones individuales con un plan pensado para cada persona. Revisa las especialidades y reserva tu hora en línea en minutos."
        chips={[
          { icon: Clock, label: 'Lunes a sábado, 09:00 a 18:00' },
          { icon: UserRound, label: 'Atención 1 a 1' },
          { icon: MapPin, label: `${contact.address.comune}, ${contact.address.city}` },
        ]}
      />

      <Section id="services" title="Nuestras especialidades" align="left">
        <div className="card-grid" role="list">
          {clinicalServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </Section>

      <Section
        id="reservar"
        tinted
        eyebrow="Reserva en línea"
        eyebrowIcon={CalendarCheck}
        title="Reserva tu hora"
        subtitle="Las horas que ves están libres ahora mismo. También puedes reservar desde el chat o por WhatsApp."
      >
        <div className="booking-layout">
          <div className="form-card">
            <BookingForm />
          </div>
          <aside className="booking-aside" aria-labelledby="horario-title">
            <h3 id="horario-title" className="booking-aside-title">
              <CalendarClock size={20} aria-hidden="true" />
              Horario de atención
            </h3>
            <ScheduleTable />
          </aside>
        </div>
      </Section>
    </>
  );
}
