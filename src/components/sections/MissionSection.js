import { Section } from '@/components/ui';

export default function MissionSection() {
  return (
    <Section id="mission" className="mission mission--with-image" title="Nuestra Misión">
      <div className="mission-content">
        <p>
          En APED creemos que cada persona merece acceso a servicios de calidad
          que potencien su desarrollo integral. Ofrecemos atención clínica
          personalizada y talleres grupales diseñados para fortalecer habilidades
          y fomentar la inclusión social.
        </p>
      </div>
      <div className="mission-image">
        <img
          src="/images/mission.jpeg"
          alt="Actividad de APED mostrando inclusión y desarrollo integral"
          loading="lazy"
        />
      </div>
    </Section>
  );
}
