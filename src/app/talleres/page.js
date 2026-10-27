import { Users, CalendarDays, UsersRound, ListChecks, MessageCircle } from 'lucide-react';
import { Section, Button } from '@/components/ui';
import PageHero from '@/components/sections/PageHero';
import { WorkshopCard } from '@/components/features/services';
import { workshops } from '@/config/workshops';
import { contact } from '@/config/navigation';

export const metadata = {
  title: 'Talleres',
  description:
    'Talleres grupales de Habilidades Sociales, Arteterapia, Cocina y Motricidad. Solo sábados, con aforo limitado.',
};

export default function WorkshopsPage() {
  const message = encodeURIComponent('Hola, quiero información sobre los talleres de los sábados.');

  return (
    <>
      <PageHero
        eyebrow="Talleres grupales"
        eyebrowIcon={Users}
        title="Aprender, crear y compartir en comunidad"
        lead="Talleres en grupos pequeños para desarrollar habilidades, ganar autonomía y hacer amistades. Todos los sábados."
        chips={[
          { icon: CalendarDays, label: 'Solo sábados' },
          { icon: UsersRound, label: 'Cupos limitados' },
          { icon: ListChecks, label: 'Lista de espera automática' },
        ]}
      />

      <Section id="workshops" title="Elige tu taller" align="left">
        <div className="card-grid" role="list">
          {workshops.map((ws) => (
            <WorkshopCard key={ws.id} workshop={ws} showSignup />
          ))}
        </div>
      </Section>

      <Section id="talleres-cta" tinted>
        <div className="cta-band">
          <span className="cta-band-icon" aria-hidden="true">
            <MessageCircle size={28} />
          </span>
          <h2>¿Tienes dudas sobre qué taller elegir?</h2>
          <p>Escríbenos y te ayudamos a encontrar el taller adecuado para cada persona.</p>
          <div className="cta-actions">
            <Button href={`${contact.phone.whatsapp}?text=${message}`} variant="light" size="lg" target="_blank" rel="noopener noreferrer">
              <MessageCircle size={20} aria-hidden="true" />
              Escribir por WhatsApp
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
