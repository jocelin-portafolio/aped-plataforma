import { donationJsonLd } from '@/lib/jsonld';
import JsonLd from '@/components/layout/JsonLd';
import { Section } from '@/components/ui';
import { DonationForm } from '@/components/features/donations';

export const metadata = {
  title: 'Apóyanos',
  description:
    'Realiza una donación o suscríbete como socio para apoyar los servicios de APED.',
};

export default function SupportPage() {
  return (
    <>
      <JsonLd data={donationJsonLd()} />
      <Section
        id="support"
        className="support-page"
        title="Apóyanos"
        subtitle="Tu contribución nos permite seguir empoderando vidas"
      >
        <DonationForm />
      </Section>
    </>
  );
}
