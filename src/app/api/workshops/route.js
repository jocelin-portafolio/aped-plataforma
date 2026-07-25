import { connectDB } from '@/config/db';
import Workshop from '@/models/Workshop';
import WorkshopSession from '@/models/WorkshopSession';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/responses';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const slug = searchParams.get('slug');

    if (slug) {
      const workshop = await Workshop.findOne({ slug, active: true }).lean();
      if (!workshop) return errorResponse('Taller no encontrado', 404);

      const sessions = await WorkshopSession.find({ workshopId: workshop._id })
        .sort({ date: 1 })
        .lean();

      return successResponse({ ...workshop, sessions });
    }

    const filter = { active: true };
    if (category) filter.category = category;

    const total = await Workshop.countDocuments(filter);
    const workshops = await Workshop.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return paginatedResponse(workshops, total, page, limit);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.title || !body.category || !body.maxCapacity) {
      return errorResponse('title, category y maxCapacity son requeridos');
    }

    const workshop = await Workshop.create(body);
    return successResponse(workshop, 201);
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse('Ya existe un taller con ese slug', 409);
    }
    return errorResponse(err.message, 500);
  }
}
