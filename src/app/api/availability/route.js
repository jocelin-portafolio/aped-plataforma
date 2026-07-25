import { connectDB } from '@/config/db';
import Appointment from '@/models/Appointment';
import Therapist from '@/models/Therapist';
import { successResponse, errorResponse } from '@/lib/responses';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapistId');
    const specialty = searchParams.get('specialty');
    const date = searchParams.get('date');

    if (!therapistId || !date) {
      return errorResponse('therapistId y date son requeridos');
    }

    const therapist = await Therapist.findById(therapistId);
    if (!therapist) return errorResponse('Terapeuta no encontrado', 404);

    const d = new Date(date);
    const dayNames = [
      'sunday', 'monday', 'tuesday', 'wednesday',
      'thursday', 'friday', 'saturday',
    ];
    const dayOfWeek = dayNames[d.getDay()];
    const daySchedule = therapist.schedule[dayOfWeek];

    if (!daySchedule?.available) {
      return successResponse({ availableSlots: [], message: 'El terapeuta no atiende este día' });
    }

    const allSlots = daySchedule.slots || [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    ];

    const dateStart = new Date(d.setHours(0, 0, 0, 0));
    const dateEnd = new Date(d.setHours(23, 59, 59, 999));

    const booked = await Appointment.find({
      therapistId,
      date: { $gte: dateStart, $lte: dateEnd },
      status: { $nin: ['cancelled'] },
    })
      .select('startTime')
      .lean();

    const bookedTimes = new Set(booked.map((a) => a.startTime));
    const availableSlots = allSlots.filter((slot) => !bookedTimes.has(slot));

    return successResponse({ availableSlots, dayOfWeek });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
