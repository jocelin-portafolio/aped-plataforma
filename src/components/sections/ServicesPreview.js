import Link from 'next/link';
import { Section } from '@/components/ui';
import { clinicalServices } from '@/config/services';

export default function ServicesPreview() {
  return (
    <Section
      id="services-preview"
      className="services-preview"
      title="Servicios Clínicos"
      subtitle="Atención personalizada de lunes a sábado"
    >
      <ul className="preview-list">
        {clinicalServices.map((s) => (
          <li key={s.id}>
            <Link href={`/servicios-clinicos#${s.id}`}>{s.name}</Link>
          </li>
        ))}
      </ul>
      <Link href="/servicios-clinicos" className="link-more">Ver todos los servicios</Link>
    </Section>
  );
}
