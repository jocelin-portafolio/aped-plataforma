import { Check, Minus } from 'lucide-react';
import { clinicalServices } from '@/config/services';

// Horario general de atención. La disponibilidad real de cada hora se
// consulta en el formulario de reservas, que lee la agenda en tiempo real.
const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const { hours } = clinicalServices[0].schedule;

export default function ScheduleTable() {
  return (
    <div className="schedule-table">
      <table>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Terapias</th>
            <th scope="col">Talleres</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day}>
              <th scope="row">{day}</th>
              <td>{hours.replace(' - ', ' a ')}</td>
              <td>
                {day === 'Sábado' ? (
                  <span className="schedule-yes">
                    <Check size={16} aria-hidden="true" /> Sí
                  </span>
                ) : (
                  <span className="schedule-no">
                    <Minus size={16} aria-hidden="true" /> No
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
