import { Heart, CalendarCheck, HandHeart } from 'lucide-react';
import { Button } from '@/components/ui';

export default function CTASection() {
  return (
    <section className="section" id="cta" aria-labelledby="cta-title">
      <div className="container">
        <div className="cta-band">
          <span className="cta-band-icon" aria-hidden="true">
            <Heart size={28} fill="currentColor" />
          </span>
          <h2 id="cta-title">¿Damos el primer paso juntos?</h2>
          <p>Reserva una sesión en minutos o apoya a APED para que más familias accedan a terapia.</p>
          <div className="cta-actions">
            <Button href="/servicios-clinicos#reservar" variant="light" size="lg">
              <CalendarCheck size={20} aria-hidden="true" />
              Reservar una hora
            </Button>
            <Button href="/apoyanos" variant="outline-light" size="lg">
              <HandHeart size={20} aria-hidden="true" />
              Donar
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
