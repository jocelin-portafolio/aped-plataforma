'use client';

import { useFormState } from '@/hooks/useFormState';
import { Button, Alert } from '@/components/ui';

export default function DonationForm() {
  const { values, loading, result, updateField, submit } = useFormState({
    donorName: '',
    donorEmail: '',
    amount: '',
    type: 'one-time',
    paymentMethod: 'card',
    message: '',
    anonymous: false,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    await submit('/api/donations', {
      body: JSON.stringify({ ...values, amount: Number(values.amount) }),
    });
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Formulario de donaciones" className="form">
      <h2>Realizar Donación</h2>

      <div className="form-group">
        <label htmlFor="donorName">Nombre</label>
        <input
          id="donorName"
          type="text"
          required
          value={values.donorName}
          onChange={(e) => updateField('donorName', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="donorEmail">Email</label>
        <input
          id="donorEmail"
          type="email"
          required
          value={values.donorEmail}
          onChange={(e) => updateField('donorEmail', e.target.value)}
        />
      </div>

      <fieldset className="form-group">
        <legend>Tipo de donación</legend>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="type"
              value="one-time"
              checked={values.type === 'one-time'}
              onChange={(e) => updateField('type', e.target.value)}
            />
            Donación Única
          </label>
          <label>
            <input
              type="radio"
              name="type"
              value="monthly-subscription"
              checked={values.type === 'monthly-subscription'}
              onChange={(e) => updateField('type', e.target.value)}
            />
            Suscripción Mensual (Socio)
          </label>
        </div>
      </fieldset>

      <div className="form-group">
        <label htmlFor="amount">Monto (CLP)</label>
        <input
          id="amount"
          type="number"
          min="1"
          required
          value={values.amount}
          onChange={(e) => updateField('amount', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="paymentMethod">Método de pago</label>
        <select
          id="paymentMethod"
          value={values.paymentMethod}
          onChange={(e) => updateField('paymentMethod', e.target.value)}
        >
          <option value="card">Tarjeta</option>
          <option value="bank-transfer">Transferencia</option>
          <option value="cash">Efectivo</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="message">Mensaje (opcional)</label>
        <textarea
          id="message"
          value={values.message}
          onChange={(e) => updateField('message', e.target.value)}
        />
      </div>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={values.anonymous}
          onChange={(e) => updateField('anonymous', e.target.checked)}
        />
        Donar de forma anónima
      </label>

      <Button type="submit" disabled={loading} variant="secondary">
        {loading ? 'Procesando...' : 'Donar'}
      </Button>

      {result && (
        result.success
          ? <Alert.Success>Donación registrada. ¡Gracias!</Alert.Success>
          : <Alert.Error>{result.error || 'Error al procesar'}</Alert.Error>
      )}
    </form>
  );
}
