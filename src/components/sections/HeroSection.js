import { Heart, CalendarCheck, ShieldCheck, UserRound, Clock, Stethoscope, Users } from 'lucide-react';
import { Button, IconBadge } from '@/components/ui';
import { clinicalServices } from '@/config/services';

export default function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span>
              <Heart size={14} fill="currentColor" aria-hidden="true" />
            </span>
            Organización comunitaria en Maipú
          </p>
          <h1 id="hero-title">
            Empoderando vidas a través de la <span className="text-gradient">inclusión</span>
          </h1>
          <p className="hero-lead">
            Servicios clínicos especializados y talleres grupales para personas con discapacidad y
            sus familias, con atención cercana y personalizada.
          </p>
          <div className="hero-actions">
            <Button href="/servicios-clinicos#reservar" size="lg">
              <CalendarCheck size={20} aria-hidden="true" />
              Reservar una hora
            </Button>
            <Button href="/apoyanos" variant="ghost" size="lg">
              <Heart size={20} aria-hidden="true" />
              Quiero apoyar
            </Button>
          </div>
          <ul className="hero-trust">
            <li>
              <ShieldCheck size={18} aria-hidden="true" />
              Profesionales especializados
            </li>
            <li>
              <UserRound size={18} aria-hidden="true" />
              Atención 1 a 1
            </li>
            <li>
              <Clock size={18} aria-hidden="true" />
              Lunes a sábado
            </li>
          </ul>
        </div>

        <div className="hero-media">
          <img src="/images/hero.jpeg" alt="Niños y familias participando en una actividad de APED" />
          <div className="hero-float hero-float--top">
            <IconBadge icon={Stethoscope} tone="blue" size="sm" />
            <div>
              <strong>{clinicalServices.length} especialidades</strong>
              <small>Terapias individuales</small>
            </div>
          </div>
          <div className="hero-float hero-float--bottom">
            <IconBadge icon={Users} tone="green" size="sm" />
            <div>
              <strong>Talleres grupales</strong>
              <small>Todos los sábados</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
