import { bookAppointment } from '@/lib/booking';
import { successResponse, errorResponse } from '@/lib/responses';

const STATUS_BY_REASON = { invalid: 400, taken: 409, 'email-in-use': 409 };

// Reserva un bloque desde el formulario web. Usa la misma validación que el
// chat: el bloque debe seguir libre en la agenda al momento de reservar.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('JSON inválido');
  }

  const { specialty, therapistId, date, startTime, patient } = body ?? {};
  if (typeof therapistId !== 'string' || !/^[a-f\d]{24}$/i.test(therapistId)) {
    return errorResponse('therapistId inválido');
  }
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return errorResponse('date debe tener formato YYYY-MM-DD');
  }

  // Solo se aceptan los campos esperados, como texto.
  const fields = ['firstName', 'lastName', 'dateOfBirth', 'email', 'phone'];
  const cleanPatient = Object.fromEntries(
    fields.map((f) => [f, typeof patient?.[f] === 'string' ? patient[f].trim() : ''])
  );

  try {
    const result = await bookAppointment({
      specialty,
      therapistId,
      date,
      startTime,
      patient: cleanPatient,
      source: 'formulario web',
    });
    if (!result.ok) {
      return Response.json(
        { success: false, error: result.message, reason: result.reason },
        { status: STATUS_BY_REASON[result.reason] ?? 400 }
      );
    }
    return successResponse(result.appointment, 201);
  } catch (err) {
    console.error('[api/booking]', err);
    return errorResponse('No pudimos completar la reserva en este momento', 503);
  }
}
