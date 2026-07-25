import { connectDB } from '@/config/db';
import Donation from '@/models/Donation';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/responses';
import { validateDonation } from '@/lib/validators';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.paymentStatus = status;

    const total = await Donation.countDocuments(filter);
    const donations = await Donation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return paginatedResponse(donations, total, page, limit);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const errors = validateDonation(body);
    if (errors.length) return errorResponse(errors.join(', '));

    if (body.type === 'monthly-subscription') {
      body.subscriptionActive = true;
    }

    const donation = await Donation.create(body);

    return successResponse(
      {
        donationId: donation._id,
        amount: donation.amount,
        type: donation.type,
        paymentStatus: donation.paymentStatus,
        message: 'Donación registrada exitosamente',
      },
      201
    );
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('Donation ID is required');

    const body = await request.json();
    const donation = await Donation.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!donation) return errorResponse('Donación no encontrada', 404);
    return successResponse(donation);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
