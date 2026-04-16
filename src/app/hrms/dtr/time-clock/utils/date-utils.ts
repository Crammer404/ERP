export const toApiDate = (date?: Date): string | undefined => {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const toDaysLeft = (deletedAt: string | null): number | null => {
  if (!deletedAt) return null;

  const parse = (raw: string): Date | null => {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;

    const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw;
    const d2 = new Date(normalized);
    if (!Number.isNaN(d2.getTime())) return d2;
    return null;
  };

  const deleted = parse(deletedAt);
  if (!deleted) return null;

  const diffMs = Date.now() - deleted.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, 90 - diffDays);
};

