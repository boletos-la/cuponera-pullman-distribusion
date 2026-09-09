/**
 * Módulo de Validación y Formateo de RUT Chileno (Algoritmo Módulo 11)
 * Desarrollado para Pullman Costa Central / WIT SPA
 */

export function cleanRut(rut: string): string {
  if (!rut) return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function calculateDV(rutBody: string): string {
  const cleanBody = rutBody.replace(/\D/g, '');
  if (!cleanBody) return '';

  let sum = 0;
  let multiplier = 2;

  for (let i = cleanBody.length - 1; i >= 0; i--) {
    sum += parseInt(cleanBody.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return remainder.toString();
}

export function validateRut(rut: string): boolean {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 8 || cleaned.length > 9) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  if (!/^\d+$/.test(body)) return false;

  const expectedDv = calculateDV(body);
  return dv === expectedDv;
}

export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (!cleaned) return '';
  if (cleaned.length < 2) return cleaned;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // Formato 12.345.678-K
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}
