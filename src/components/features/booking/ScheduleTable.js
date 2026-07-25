export default function ScheduleTable() {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const hours = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  return (
    <div className="schedule-table">
      <h3>Horario de Atención</h3>
      <p className="section-subtitle">Lunes a sábado</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Hora</th>
            {days.map((d) => (
              <th key={d} scope="col">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((h) => (
            <tr key={h}>
              <th scope="row">{h}</th>
              {days.map((d) => (
                <td key={`${d}-${h}`}>Disponible</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
