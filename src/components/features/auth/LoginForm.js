'use client';

import { useFormState } from '@/hooks/useFormState';
import { Button, Alert } from '@/components/ui';

export default function LoginForm({ next = '' }) {
  const { values, loading, result, updateField, submit } = useFormState({ email: '', password: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    const data = await submit('/api/auth/login', {
      body: JSON.stringify({ ...values, next }),
    });
    // Navegación completa para que el panel se cargue con la cookie nueva.
    if (data.success) window.location.assign(data.data.redirect);
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Iniciar sesión" className="form login-form">
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          value={values.email}
          onChange={(e) => updateField('email', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => updateField('password', e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </Button>

      {result && !result.success && <Alert.Error>{result.error || 'No pudimos iniciar sesión'}</Alert.Error>}

      <p className="form-hint">
        ¿Olvidaste tu contraseña? Pídele a un administrador de APED que la restablezca.
      </p>
    </form>
  );
}
