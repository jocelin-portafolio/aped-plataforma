import { connectDB } from '@/config/db';
import Appointment from '@/models/Appointment';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/responses';
import { validateAppointment } from '@/lib/validators';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const therapistId = searchParams.get('therapistId');
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
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('Appointment ID is required');

    const body = await request.json();

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
