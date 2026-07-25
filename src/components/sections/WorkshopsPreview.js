import Link from 'next/link';
import { Section } from '@/components/ui';
import { workshops } from '@/config/workshops';

export default function WorkshopsPreview() {
  return (
    <Section
      id="workshops-preview"
      className="workshops-preview"
      title="Talleres Grupales"
      subtitle="Sábados - Cupos limitados"
    >
      <ul className="preview-list">
        {workshops.map((w) => (
          <li key={w.id}>
            <Link href={`/talleres#${w.id}`}>{w.title}</Link>
          </li>
        ))}
      </ul>
      <Link href="/talleres" className="link-more">Ver todos los talleres</Link>
    </Section>
  );
}
