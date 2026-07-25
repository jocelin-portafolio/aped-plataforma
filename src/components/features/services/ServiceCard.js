import { Card } from '@/components/ui';

export default function ServiceCard({ service }) {
  return (
    <Card id={service.id} variant="bordered" role="listitem">
      <Card.Header>
        <h3>{service.name}</h3>
      </Card.Header>
      <Card.Body>
        <p>{service.description}</p>
        {service.schedule && (
          <p className="card-meta">
            {service.schedule.days} &middot; {service.schedule.hours}
          </p>
        )}
      </Card.Body>
    </Card>
  );
}
