import { CalendarDays, UsersRound, MessageCircle } from 'lucide-react';
import { Card, Badge, IconBadge } from '@/components/ui';
import { contact } from '@/config/navigation';
import { workshopIcons, fallbackIcon } from './icons';

export default function WorkshopCard({ workshop, showSignup = false }) {
  const { icon, tone } = workshopIcons[workshop.id] ?? fallbackIcon;
  const message = encodeURIComponent(`Hola, quiero inscribirme en el taller de ${workshop.title}.`);

  return (
    <Card id={workshop.id} role="listitem">
      <Card.Header>
        <IconBadge icon={icon} tone={tone} />
        <Badge variant="info">
          <CalendarDays size={13} aria-hidden="true" />
          {workshop.day}
        </Badge>
      </Card.Header>
      <h3>{workshop.title}</h3>
      <Card.Body>
        <p>{workshop.description}</p>
      </Card.Body>
      <Card.Footer>
        <span className="card-meta">
          <UsersRound size={15} aria-hidden="true" />
          Hasta {workshop.capacity} personas
        </span>
        {showSignup && (
          <a
            href={`${contact.phone.whatsapp}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link-arrow"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Inscribirme
          </a>
        )}
      </Card.Footer>
    </Card>
  );
}
