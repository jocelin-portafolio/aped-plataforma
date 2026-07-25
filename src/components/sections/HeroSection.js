import { Button } from '@/components/ui';

export default function HeroSection() {
  return (
    <section className="hero hero--with-image" aria-labelledby="hero-title">
      <div className="hero-bg">
        <img src="/images/hero.jpeg" alt="" aria-hidden="true" />
        <div className="hero-overlay" />
      </div>
      <div className="hero-content">
        <h1 id="hero-title">Empoderando vidas a través de la inclusión</h1>
        <p>
          Servicios clínicos especializados y talleres grupales para personas
          con discapacidad.
        </p>
        <div className="hero-actions">
          <Button href="/servicios-clinicos" variant="primary">Reservar Sesión</Button>
          <Button href="/apoyanos" variant="secondary">Donar Ahora</Button>
        </div>
      </div>
    </section>
  );
}
