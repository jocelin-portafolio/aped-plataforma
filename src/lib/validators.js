export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  return /^\+?[\d\s-]{8,15}$/.test(phone);
}

export function validateTime(time) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function validateAppointment(data) {
  const errors = [];
  if (!data.clientId) errors.push('clientId is required');
  if (!data.therapistId) errors.push('therapistId is required');
  if (!data.specialty) errors.push('specialty is required');
  if (!data.date) errors.push('date is required');
  if (!validateTime(data.startTime)) errors.push('Invalid startTime format (HH:MM)');
  if (!validateTime(data.endTime)) errors.push('Invalid endTime format (HH:MM)');
  if (data.startTime && data.endTime && data.startTime >= data.endTime) {
    errors.push('startTime must be before endTime');
  }
  return errors;
}

export function validateWorkshopEnrollment(data) {
  const errors = [];
  if (!data.clientId) errors.push('clientId is required');
  if (!data.sessionId) errors.push('sessionId is required');
  return errors;
}

export function validateDonation(data) {
  const errors = [];
  if (!data.donorName?.trim()) errors.push('donorName is required');
  if (!validateEmail(data.donorEmail)) errors.push('Valid email is required');
  if (!data.amount || data.amount < 1) errors.push('amount must be >= 1');
  if (!['one-time', 'monthly-subscription'].includes(data.type)) {
    errors.push('type must be one-time or monthly-subscription');
  }
  if (!['card', 'bank-transfer', 'cash'].includes(data.paymentMethod)) {
    errors.push('Invalid paymentMethod');
  }
  return errors;
}
