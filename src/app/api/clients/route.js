import { connectDB } from '@/config/db';
import Client from '@/models/Client';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/responses';
import { validateEmail } from '@/lib/validators';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const filter = { active: true };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Client.countDocuments(filter);
    const clients = await Client.find(filter)
      .sort({ lastName: 1, firstName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return paginatedResponse(clients, total, page, limit);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.firstName || !body.lastName || !body.email || !body.phone) {
      return errorResponse('firstName, lastName, email y phone son requeridos');
    }
    if (!validateEmail(body.email)) {
      return errorResponse('Email inválido');
    }

    const client = await Client.create(body);
    return successResponse(client, 201);
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse('Ya existe un cliente con ese email', 409);
    }
    return errorResponse(err.message, 500);
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('Client ID is required');

    const body = await request.json();
    const client = await Client.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!client) return errorResponse('Cliente no encontrado', 404);
    return successResponse(client);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
