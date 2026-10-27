'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState } from '@/hooks/useFormState';
import { Button, Alert } from '@/components/ui';

const ROLE_LABELS = { admin: 'Administrador', therapist: 'Terapeuta' };

const EMPTY = { name: '', email: '', password: '', role: 'therapist', therapistId: '' };

/** Lista de cuentas del equipo y formulario para crear una nueva. */
export default function UserManager({ users, therapists, currentUserId }) {
  const router = useRouter();
  const { values, loading, result, updateField, updateFields, submit } = useFormState(EMPTY);
  const [rowError, setRowError] = useState(null);

  // Fichas de terapeuta que todavía no tienen cuenta.
  const linked = new Set(users.map((u) => u.therapistId).filter(Boolean));
  const freeTherapists = therapists.filter((t) => !linked.has(t.id));

  async function handleCreate(e) {
    e.preventDefault();
    const data = await submit('/api/admin/users', { body: JSON.stringify(values) });
    if (data.success) {
      updateFields(EMPTY);
      router.refresh();
    }
  }

  async function patchUser(id, body) {
    setRowError(null);
    const res = await fetch(`/api/admin/users?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!json.success) {
      setRowError(json.error || 'No se pudo actualizar la cuenta');
      return false;
    }
    router.refresh();
    return true;
  }

  async function resetPassword(user) {
    const password = window.prompt(`Nueva contraseña para ${user.name} (mínimo 10 caracteres):`);
    if (!password) return;
    if (await patchUser(user.id, { password })) {
      window.alert('Contraseña actualizada. Compártela con la persona por un canal seguro.');
    }
  }

  return (
    <div className="user-manager">
      {rowError && <Alert.Error>{rowError}</Alert.Error>}
      <div className="panel-table-wrap">
        <table className="panel-table">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Email</th>
              <th scope="col">Rol</th>
              <th scope="col">Estado</th>
              <th scope="col">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.active ? '' : 'is-closed'}>
                <td>
                  {u.name}
                  {u.therapist && (
                    <>
                      <br />
                      <small>Ficha: {u.therapist}</small>
                    </>
                  )}
                </td>
                <td>{u.email}</td>
                <td>{ROLE_LABELS[u.role]}</td>
                <td>{u.active ? 'Activa' : 'Desactivada'}</td>
                <td className="panel-actions">
                  <button type="button" className="btn btn--sm btn-ghost" onClick={() => resetPassword(u)}>
                    Cambiar contraseña
                  </button>
                  {u.id !== currentUserId && (
                    <button
                      type="button"
                      className={`btn btn--sm ${u.active ? 'btn-danger' : 'btn-ghost'}`}
                      onClick={() => patchUser(u.id, { active: !u.active })}
                    >
                      {u.active ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleCreate} className="form panel-form" aria-label="Crear cuenta">
        <h3>Crear cuenta</h3>
        <div className="form-group">
          <label htmlFor="new-role">Rol</label>
          <select id="new-role" value={values.role} onChange={(e) => updateFields({ role: e.target.value, therapistId: '' })}>
            <option value="therapist">Terapeuta</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {values.role === 'therapist' && (
          <div className="form-group">
            <label htmlFor="new-therapist">Ficha de terapeuta</label>
            <select
              id="new-therapist"
              required
              value={values.therapistId}
              onChange={(e) => {
                const t = therapists.find((x) => x.id === e.target.value);
                updateFields({ therapistId: e.target.value, name: values.name || t?.name || '' });
              }}
            >
              <option value="">Seleccionar...</option>
              {freeTherapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.specialties.join(', ')})
                </option>
              ))}
            </select>
            {!freeTherapists.length && <small className="form-hint">Todas las fichas ya tienen cuenta.</small>}
          </div>
        )}
        <div className="form-group">
          <label htmlFor="new-name">Nombre</label>
          <input id="new-name" required value={values.name} onChange={(e) => updateField('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="new-email">Email</label>
          <input
            id="new-email"
            type="email"
            required
            autoComplete="off"
            value={values.email}
            onChange={(e) => updateField('email', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="new-password">Contraseña inicial</label>
          <input
            id="new-password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => updateField('password', e.target.value)}
          />
          <small className="form-hint">Mínimo 10 caracteres. Compártela con la persona por un canal seguro.</small>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </Button>
        {result && (result.success ? <Alert.Success>Cuenta creada.</Alert.Success> : <Alert.Error>{result.error}</Alert.Error>)}
      </form>
    </div>
  );
}
