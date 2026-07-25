import { connectDB } from '@/config/db';
import Therapist from '@/models/Therapist';
import { successResponse, errorResponse } from '@/lib/responses';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const day = searchParams.get('day');

    const filter = { active: true };
    if (specialty) filter.specialties = specialty;

    let therapists = await Therapist.find(filter)
      .sort({ lastName: 1 })
      .lean();

    if (day) {
      therapists = therapists.filter((t) => t.schedule[day]?.available);
    }

    return successResponse(therapists);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.firstName || !body.lastName || !body.email || !body.specialties) {
      return errorResponse('firstName, lastName, email y specialties son requeridos');
    }

    const therapist = await Therapist.create(body);
    return successResponse(therapist, 201);
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse('Ya existe un terapeuta con ese email', 409);
    }
    return errorResponse(err.message, 500);
  }
}
