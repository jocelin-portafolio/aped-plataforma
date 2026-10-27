import { HeartHandshake, Accessibility, Users, Target } from 'lucide-react';
import { IconBadge } from '@/components/ui';

const VALUES = [
  {
    icon: Accessibility,
    tone: 'blue',
    title: 'Inclusión real',
    text: 'Espacios y actividades pensados para que todas las personas participen.',
  },
  {
    icon: HeartHandshake,
    tone: 'red',
    title: 'Trato cercano',
    text: 'Acompañamos a cada persona y a su familia con empatía y respeto.',
  },
  {
    icon: Users,
    tone: 'green',
    title: 'Comunidad',
    text: 'Talleres donde se comparte, se aprende y se crean lazos.',
  },
];

export default function MissionSection() {
  return (
    <section className="section" id="mission" aria-labelledby="mission-title">
      <div className="container split">
        <div className="split-media">
          <img src="/images/mission.jpeg" alt="Actividad de APED mostrando inclusión y desarrollo integral" loading="lazy" />
        </div>
        <div className="split-copy">
          <span className="eyebrow">
            <Target size={14} strokeWidth={2.5} aria-hidden="true" />
            Nuestra misión
          </span>
          <h2 id="mission-title">Cada persona merece desarrollar todo su potencial</h2>
          <p>
            En APED creemos que cada persona merece acceso a servicios de calidad que potencien su
            desarrollo integral. Ofrecemos atención clínica personalizada y talleres grupales
            diseñados para fortalecer habilidades y fomentar la inclusión social.
          </p>
          <ul className="value-list">
            {VALUES.map((v) => (
              <li key={v.title}>
                <IconBadge icon={v.icon} tone={v.tone} size="sm" />
                <div>
                  <strong>{v.title}</strong>
                  <span>{v.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
