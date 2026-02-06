/**
 * Parse a date string from API (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss).
 */
export const parseApiDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/);
  if (m) {
    const [, y, mo, d, hh = '00', mm = '00', ss = '00'] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm), Number(ss));
  }
  const dt = new Date(value);
  return isNaN(dt.getTime()) ? null : dt;
};

/**
 * Normalize date to start of the day (00:00:00).
 */
export const normalizeStartOfDay = (d: Date): Date => {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
};

/**
 * Normalize date to end of the day (23:59:59).
 */
export const normalizeEndOfDay = (d: Date): Date => {
  const n = new Date(d);
  n.setHours(23, 59, 59, 999);
  return n;
};

/**
 * Format date into a readable "Month Day, Year" string.
 */
export const formatHumanDate = (d: Date): string =>
  d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });