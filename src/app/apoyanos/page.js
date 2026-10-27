import { HandHeart, Stethoscope, Palette, Users, ShieldCheck } from 'lucide-react';
import { donationJsonLd } from '@/lib/jsonld';
import JsonLd from '@/components/layout/JsonLd';
import { Section, IconBadge } from '@/components/ui';
import PageHero from '@/components/sections/PageHero';
import { DonationForm } from '@/components/features/donations';

export const metadata = {
  title: 'Apóyanos',
  description:
    'Realiza una donación o suscríbete como socio para apoyar los servicios de APED.',
};

const IMPACT = [
  {
    icon: Stethoscope,
    tone: 'blue',
    title: 'Más horas de terapia',
    text: 'Ayudas a que más familias accedan a sesiones con especialistas.',
  },
  {
    icon: Palette,
    tone: 'red',
    title: 'Materiales para talleres',
    text: 'Arte, cocina y motricidad necesitan insumos en cada sesión.',
  },
  {
    icon: Users,
    tone: 'green',
    title: 'Una comunidad más fuerte',
    text: 'Sostienes un espacio de encuentro e inclusión en Maipú.',
  },
];

export default function SupportPage() {
  return (
    <>
      <JsonLd data={donationJsonLd()} />
      <PageHero
        eyebrow="Apóyanos"
        eyebrowIcon={HandHeart}
        title="Tu aporte cambia vidas"
        lead="Con una donación única o haciéndote socio, ayudas a que más personas con discapacidad accedan a terapias y talleres."
      />

      <Section id="support" title="Haz tu aporte" align="left" className="support-page">
        <div className="booking-layout">
          <div className="form-card">
            <DonationForm />
          </div>
          <aside aria-labelledby="impacto-title">
            <h3 id="impacto-title" className="booking-aside-title">¿A dónde va tu aporte?</h3>
            <ul className="value-list">
              {IMPACT.map((item) => (
                <li key={item.title}>
                  <IconBadge icon={item.icon} tone={item.tone} size="sm" />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                </li>
              ))}
              <li>
                <IconBadge icon={ShieldCheck} tone="sky" size="sm" />
                <div>
                  <strong>Transparencia</strong>
                  <span>Puedes donar de forma anónima si lo prefieres.</span>
                </div>
              </li>
            </ul>
          </aside>
        </div>
      </Section>
    </>
  );
}
