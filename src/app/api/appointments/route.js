import { connectDB } from '@/config/db';
import Appointment from '@/models/Appointment';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/responses';
import { validateAppointment } from '@/lib/validators';
import { requireRole } from '@/lib/auth';

// Estados que puede poner un terapeuta en sus propias citas.
const THERAPIST_STATUSES = ['confirmed', 'completed', 'no-show'];

export async function GET(request) {
  const { session, response } = await requireRole(request, ['admin', 'therapist']);
  if (response) return response;
  if (session.role === 'therapist' && !session.therapistId) {
    return errorResponse('Tu cuenta no está vinculada a una ficha de terapeuta', 403);
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    // Un terapeuta solo ve su propia agenda.
    const therapistId = session.role === 'therapist' ? session.therapistId : searchParams.get('therapistId');
    const clientId = searchParams.get('clientId');
    const specialty = searchParams.get('specialty');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    const filter = {};
    if (therapistId) filter.therapistId = therapistId;
    if (clientId) filter.clientId = clientId;
    if (specialty) filter.specialty = specialty;
    if (date) {
      const d = new Date(date);
      filter.date = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lt: new Date(d.setHours(23, 59, 59, 999)),
      };
    }
    if (status) filter.status = status;

    const total = await Appointment.countDocuments(filter);
    const appointments = await Appointment.find(filter)
      .populate('clientId', 'firstName lastName email phone')
      .populate('therapistId', 'firstName lastName specialties')
      .sort({ date: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return paginatedResponse(appointments, total, page, limit);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request) {
  const { response } = await requireRole(request, ['admin']);
  if (response) return response;

  try {
    await connectDB();
    const body = await request.json();
    const errors = validateAppointment(body);
    if (errors.length) return errorResponse(errors.join(', '));

    const slotAvailable = await Appointment.isSlotAvailable(
      body.therapistId,
      body.date,
      body.startTime
    );
    if (!slotAvailable) {
      return errorResponse('Este horario ya está reservado para este terapeuta', 409);
    }

    const appointment = await Appointment.create(body);
    const populated = await appointment.populate([
      { path: 'clientId', select: 'firstName lastName email phone' },
      { path: 'therapistId', select: 'firstName lastName specialties' },
    ]);

    return successResponse(populated, 201);
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse('Conflicto de reserva: horario ocupado', 409);
    }
    return errorResponse(err.message, 500);
  }
}

export async function PATCH(request) {
  const { session, response } = await requireRole(request, ['admin', 'therapist']);
  if (response) return response;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('Appointment ID is required');

    let body = await request.json();

    // El terapeuta solo cambia el estado de sus propias citas.
    if (session.role === 'therapist') {
      if (!THERAPIST_STATUSES.includes(body.status) || Object.keys(body).length !== 1) {
        return errorResponse(`Solo puedes cambiar el estado a: ${THERAPIST_STATUSES.join(', ')}`, 403);
      }
      const own = await Appointment.exists({ _id: id, therapistId: session.therapistId });
      if (!own) return errorResponse('Cita no encontrada', 404);
      body = { status: body.status };
    }

    if (body.therapistId && body.date && body.startTime) {
      const slotAvailable = await Appointment.isSlotAvailable(
        body.therapistId,
        body.date,
        body.startTime,
        id
      );
      if (!slotAvailable) {
        return errorResponse('Horario no disponible', 409);
      }
    }

    const appointment = await Appointment.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate('clientId', 'firstName lastName email phone')
      .populate('therapistId', 'firstName lastName specialties');

    if (!appointment) return errorResponse('Cita no encontrada', 404);
    return successResponse(appointment);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function DELETE(request) {
  const { response } = await requireRole(request, ['admin']);
  if (response) return response;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('Appointment ID is required');

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!appointment) return errorResponse('Cita no encontrada', 404);
    return successResponse({ message: 'Cita cancelada' });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
