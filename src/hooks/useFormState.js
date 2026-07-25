'use client';

import { useState, useCallback } from 'react';

export function useFormState(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const updateField = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateFields = useCallback((fields) => {
    setValues((prev) => ({ ...prev, ...fields }));
  }, []);

  const submit = useCallback(async (url, options = {}) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      const data = await res.json();
      setResult(data);
      return data;
    } catch {
      const error = { success: false, error: 'Error de conexión' };
      setResult(error);
      return error;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setLoading(false);
    setResult(null);
  }, [initialValues]);

  return { values, loading, result, updateField, updateFields, submit, reset };
}
