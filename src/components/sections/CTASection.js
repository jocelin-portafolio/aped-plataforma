import { Section, Button } from '@/components/ui';

export default function CTASection() {
  return (
    <Section id="cta" className="cta" title="¿Listo para comenzar?">
      <p>Reserva una sesión o apóyanos con tu donación</p>
      <div className="cta-actions">
        <Button href="/servicios-clinicos" variant="primary">Reservar Sesión</Button>
        <Button href="/apoyanos" variant="secondary">Donar</Button>
      </div>
    </Section>
  );
}
