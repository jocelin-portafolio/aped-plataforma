import { bookingConfig } from '@/config/booking';
import { getAvailability } from '@/lib/booking';
import { errorResponse } from '@/lib/responses';

export const dynamic = 'force-dynamic';

// Bloques libres de una especialidad en los próximos días, en tiempo real.
export async function GET(request) {
  const specialty = new URL(request.url).searchParams.get('specialty');
  if (!bookingConfig.specialties.includes(specialty)) {
    return errorResponse(`specialty debe ser una de: ${bookingConfig.specialties.join(', ')}`);
  }

  try {
    const slots = await getAvailability(specialty);
    return Response.json(
      { success: true, data: { specialty, slots } },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[api/booking/availability]', err);
    return errorResponse('No pudimos consultar la agenda en este momento', 503);
  }
}
