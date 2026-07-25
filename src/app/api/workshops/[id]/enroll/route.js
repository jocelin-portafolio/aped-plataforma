import { connectDB } from '@/config/db';
import WorkshopSession from '@/models/WorkshopSession';
import Client from '@/models/Client';
import { successResponse, errorResponse } from '@/lib/responses';
import { validateWorkshopEnrollment } from '@/lib/validators';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const errors = validateWorkshopEnrollment(body);
    if (errors.length) return errorResponse(errors.join(', '));

    const client = await Client.findById(body.clientId);
    if (!client || !client.active) {
      return errorResponse('Cliente no encontrado o inactivo', 404);
    }

    const session = await WorkshopSession.findById(body.sessionId);
    if (!session) return errorResponse('Sesión de taller no encontrada', 404);
    if (session.status === 'completed' || session.status === 'cancelled') {
      return errorResponse('Esta sesión ya no está disponible', 400);
    }

    const workshop = (await import('@/models/Workshop')).default;
    const ws = await workshop.findById(session.workshopId);
    if (!ws) return errorResponse('Taller no encontrado', 404);

    session._capacity = ws.maxCapacity;
    const result = await session.addClient(body.clientId);

    return successResponse(
      {
        sessionId: session._id,
        clientId: body.clientId,
        status: result.status,
        message:
          result.status === 'waitlisted'
            ? 'Añadido a la lista de espera'
            : 'Inscripción exitosa',
      },
      201
    );
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
