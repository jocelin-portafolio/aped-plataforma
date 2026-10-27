import { clinicalServices } from '@/config/services';

// Horario general de atención. La disponibilidad real de cada hora se
// consulta en el formulario de reservas, que lee la agenda en tiempo real.
const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const { hours } = clinicalServices[0].schedule;

export default function ScheduleTable() {
  return (
    <div className="schedule-table">
      <h3>Horario de Atención</h3>
      <p className="section-subtitle">
        Atendemos de lunes a sábado. Las horas libres de cada profesional aparecen al reservar.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Servicios clínicos</th>
            <th scope="col">Talleres grupales</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day}>
              <th scope="row">{day}</th>
              <td>{hours.replace(' - ', ' a ')}</td>
              <td>{day === 'Sábado' ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
