import { Card, Badge } from '@/components/ui';

export default function WorkshopCard({ workshop }) {
  return (
    <Card id={workshop.id} variant="bordered" role="listitem">
      <Card.Header>
        <h3>{workshop.title}</h3>
        <Badge variant="info">{workshop.day}</Badge>
      </Card.Header>
      <Card.Body>
        <p>{workshop.description}</p>
        <p className="card-meta">Aforo: {workshop.capacity} participantes</p>
      </Card.Body>
    </Card>
  );
}
