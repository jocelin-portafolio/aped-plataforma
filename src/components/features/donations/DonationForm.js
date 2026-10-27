'use client';

import { Gift, Repeat, Heart, CheckCircle2 } from 'lucide-react';
import { useFormState } from '@/hooks/useFormState';
import { Button, Alert, IconBadge } from '@/components/ui';

const TYPES = [
  { value: 'one-time', label: 'Donación única', hint: 'Un aporte por esta vez', icon: Gift, tone: 'red' },
  { value: 'monthly-subscription', label: 'Socio mensual', hint: 'Un aporte cada mes', icon: Repeat, tone: 'blue' },
];

const SUGGESTED_AMOUNTS = [5000, 10000, 20000, 50000];

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

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
      <fieldset className="form-group">
        <legend>Tipo de aporte</legend>
        <div className="choice-grid">
          {TYPES.map((t) => (
            <label key={t.value} className="choice-card">
              <input
                type="radio"
                name="type"
                value={t.value}
                checked={values.type === t.value}
                onChange={(e) => updateField('type', e.target.value)}
              />
              <IconBadge icon={t.icon} tone={t.tone} size="sm" />
              <span>
                <strong>{t.label}</strong>
                <small>{t.hint}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-group">
        <label htmlFor="amount">Monto (CLP)</label>
        <div className="amount-chips" role="group" aria-label="Montos sugeridos">
          {SUGGESTED_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              className="amount-chip"
              aria-pressed={Number(values.amount) === amount}
              onClick={() => updateField('amount', String(amount))}
            >
              {clp.format(amount)}
            </button>
          ))}
        </div>
        <input
          id="amount"
          type="number"
          min="1"
          step="1"
          required
          inputMode="numeric"
          placeholder="Otro monto"
          value={values.amount}
          onChange={(e) => updateField('amount', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="donorName">Nombre</label>
          <input
            id="donorName"
            type="text"
            required
            autoComplete="name"
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
            autoComplete="email"
            value={values.donorEmail}
            onChange={(e) => updateField('donorEmail', e.target.value)}
          />
        </div>
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

      <Button type="submit" disabled={loading} variant="secondary" size="lg">
        <Heart size={20} aria-hidden="true" />
        {loading ? 'Procesando...' : 'Donar'}
      </Button>

      {result &&
        (result.success ? (
          <Alert.Success>
            <CheckCircle2 size={18} aria-hidden="true" className="alert-icon" /> Donación registrada. ¡Muchas gracias!
          </Alert.Success>
        ) : (
          <Alert.Error>{result.error || 'Error al procesar'}</Alert.Error>
        ))}
    </form>
  );
}
