const MONTH_SHORT_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseYmdToLocalDate = (value: string): Date | null => {
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, monthIndex, day);
};

export const formatReportDateRange = (dateRange: string): string => {
  const [rawStart, rawEnd] = String(dateRange).split('to').map((v) => v.trim());
  if (!rawStart || !rawEnd) return dateRange;

  const start = parseYmdToLocalDate(rawStart);
  const end = parseYmdToLocalDate(rawEnd);
  if (!start || !end) return dateRange;

  const startMonth = MONTH_SHORT_NAMES[start.getMonth()] ?? '';
  const endMonth = MONTH_SHORT_NAMES[end.getMonth()] ?? '';
  const startDay = start.getDate();
  const endDay = end.getDate();
  const endYear = end.getFullYear();

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay} - ${endDay}, ${endYear}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
};

export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const sumPayslipEntriesByDescription = (
  entries: Array<{ description: string; total: number }> | undefined,
  target: string
): number => {
  const normalizedTarget = target.trim().toLowerCase();
  return (entries || []).reduce((sum, entry) => {
    if (String(entry?.description || '').trim().toLowerCase() !== normalizedTarget) {
      return sum;
    }
    return sum + Number(entry?.total || 0);
  }, 0);
};

export const getInitials = (name: string): string => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

export const formatGeneratedDateTime = (value?: string): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(' AM', 'AM')
    .replace(' PM', 'PM');
  return `${datePart} - ${timePart}`;
};
