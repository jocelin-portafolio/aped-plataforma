import { connectDB } from '@/config/db';
import User from '@/models/User';
import Therapist from '@/models/Therapist';
import { requireRole } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/responses';
import { validateEmail } from '@/lib/validators';

const MIN_PASSWORD = 10;

function publicUser(u) {
  return { id: String(u._id), name: u.name, email: u.email, role: u.role, active: u.active };
}

function passwordError(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`;
  }
  return null;
}

// Crea una cuenta de administrador o de terapeuta (vinculada a su ficha).
export async function POST(request) {
  const { response } = await requireRole(request, ['admin']);
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('JSON inválido');
  }
  const { name, email, password, role, therapistId } = body ?? {};

  if (typeof name !== 'string' || !name.trim()) return errorResponse('El nombre es obligatorio');
  if (!validateEmail(email || '')) return errorResponse('Email inválido');
  if (!['admin', 'therapist'].includes(role)) return errorResponse('El rol debe ser admin o therapist');
  const pwError = passwordError(password);
  if (pwError) return errorResponse(pwError);

  try {
    await connectDB();
    if (role === 'therapist') {
      if (!/^[a-f\d]{24}$/i.test(therapistId || '') || !(await Therapist.exists({ _id: therapistId }))) {
        return errorResponse('Elige la ficha de terapeuta de esta cuenta');
      }
      if (await User.exists({ therapistId })) {
        return errorResponse('Esa ficha de terapeuta ya tiene una cuenta', 409);
      }
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      ...(role === 'therapist' && { therapistId }),
    });
    return successResponse(publicUser(user), 201);
  } catch (err) {
    if (err.code === 11000) return errorResponse('Ya existe una cuenta con ese email', 409);
    console.error('[api/admin/users]', err);
    return errorResponse('No pudimos crear la cuenta', 500);
  }
}

// Activa/desactiva una cuenta o restablece su contraseña.
export async function PATCH(request) {
  const { session, response } = await requireRole(request, ['admin']);
  if (response) return response;

  const id = new URL(request.url).searchParams.get('id');
  if (!/^[a-f\d]{24}$/i.test(id || '')) return errorResponse('id inválido');

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('JSON inválido');
  }

  try {
    await connectDB();
    const user = await User.findById(id);
    if (!user) return errorResponse('Cuenta no encontrada', 404);

    if (typeof body?.active === 'boolean') {
      if (id === session.id && !body.active) return errorResponse('No puedes desactivar tu propia cuenta');
      user.active = body.active;
    }
    if (body?.password !== undefined) {
      const pwError = passwordError(body.password);
      if (pwError) return errorResponse(pwError);
      user.password = body.password;
    }

    await user.save();
    return successResponse(publicUser(user));
  } catch (err) {
    console.error('[api/admin/users]', err);
    return errorResponse('No pudimos actualizar la cuenta', 500);
  }
}
