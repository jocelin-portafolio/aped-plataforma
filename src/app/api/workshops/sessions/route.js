import { connectDB } from '@/config/db';
import WorkshopSession from '@/models/WorkshopSession';
import Workshop from '@/models/Workshop';
import { successResponse, errorResponse } from '@/lib/responses';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.workshopId || !body.date) {
      return errorResponse('workshopId y date son requeridos');
    }

    const workshop = await Workshop.findById(body.workshopId);
    if (!workshop) return errorResponse('Taller no encontrado', 404);

    const existing = await WorkshopSession.findOne({
      workshopId: body.workshopId,
      date: new Date(body.date),
    });
    if (existing) {
      return errorResponse('Ya existe una sesión para esta fecha', 409);
    }

    const session = await WorkshopSession.create({
      workshopId: body.workshopId,
      date: body.date,
      _capacity: workshop.maxCapacity,
    });

    return successResponse(session, 201);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const workshopId = searchParams.get('workshopId');

    if (!workshopId) return errorResponse('workshopId es requerido');

    const sessions = await WorkshopSession.find({ workshopId })
      .populate({
        path: 'enrolledClients.clientId',
        select: 'firstName lastName email',
      })
      .sort({ date: 1 })
      .lean();

    return successResponse(sessions);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
