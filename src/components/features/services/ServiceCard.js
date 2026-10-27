import Link from 'next/link';
import { Clock, ArrowRight, MessageCircle } from 'lucide-react';
import { Card, IconBadge } from '@/components/ui';
import { bookingConfig } from '@/config/booking';
import { contact } from '@/config/navigation';
import { serviceIcons, fallbackIcon } from './icons';

export default function ServiceCard({ service }) {
  const { icon, tone } = serviceIcons[service.id] ?? fallbackIcon;
  // Solo algunas especialidades se agendan en línea; las demás, por WhatsApp.
  const bookable = bookingConfig.specialties.includes(service.id);
  const message = encodeURIComponent(`Hola, quiero agendar una hora de ${service.name}.`);

  return (
    <Card id={service.id} role="listitem">
      <Card.Header>
        <IconBadge icon={icon} tone={tone} />
      </Card.Header>
      <h3>{service.name}</h3>
      <Card.Body>
        <p>{service.description}</p>
      </Card.Body>
      <Card.Footer>
        {service.schedule && (
          <span className="card-meta">
            <Clock size={15} aria-hidden="true" />
            {service.schedule.days}
          </span>
        )}
        {bookable ? (
          <Link href="/servicios-clinicos#reservar" className="link-arrow">
            Reservar
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <a href={`${contact.phone.whatsapp}?text=${message}`} target="_blank" rel="noopener noreferrer" className="link-arrow">
            <MessageCircle size={16} aria-hidden="true" />
            Agendar
          </a>
        )}
      </Card.Footer>
    </Card>
  );
}
