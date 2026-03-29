import type { Currency } from '@/types';

export const fmt = (amount: number, currency: Currency) => {
  if (!amount || isNaN(amount)) return currency === 'PEN' ? 'S/ 0.00' : '$ 0.00';
  const n = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return currency === 'PEN' ? `S/ ${n}` : `$ ${n}`;
};

export const fmtDate = (d: string) => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    const mos = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const hh = dt.getHours().toString().padStart(2,'0');
    const mm = dt.getMinutes().toString().padStart(2,'0');
    return `${dt.getDate()} ${mos[dt.getMonth()]}, ${hh}:${mm}`;
  } catch { return d; }
};

export const fmtDateLong = (d: string) => {
  if (!d) return '—';
  try {
    const dt = new Date(d.includes('Z') || d.includes('+') ? d : d + 'Z');
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch { return d; }
};

export const maskAcct = (n: string) =>
  n?.length >= 4 ? `•••• ${n.slice(-4)}` : n;
