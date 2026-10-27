import { Search, CalendarCheck, Smile, Sparkles } from 'lucide-react';
import { Section, IconBadge } from '@/components/ui';

const STEPS = [
  {
    icon: Search,
    tone: 'blue',
    title: 'Elige el apoyo',
    text: 'Revisa nuestras especialidades y talleres, o pregúntale a nuestro asistente en el chat.',
  },
  {
    icon: CalendarCheck,
    tone: 'sky',
    title: 'Reserva en línea',
    text: 'Elige día y hora entre los bloques libres, en la página o por WhatsApp. Sin llamadas.',
  },
  {
    icon: Smile,
    tone: 'green',
    title: 'Te acompañamos',
    text: 'Te recibimos en Maipú con un plan pensado para cada persona y su familia.',
  },
];

export default function HowItWorks() {
  return (
    <Section
      id="como-funciona"
      eyebrow="Así de simple"
      eyebrowIcon={Sparkles}
      title="¿Cómo empezar?"
      subtitle="En tres pasos tienes tu primera sesión agendada."
    >
      <ol className="steps">
        {STEPS.map((step, i) => (
          <li key={step.title} className="step">
            <span className="step-number" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <IconBadge icon={step.icon} tone={step.tone} />
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
