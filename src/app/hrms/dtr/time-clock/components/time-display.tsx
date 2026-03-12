/**
 * TimeDisplay – shared component for rendering clock-in / clock-out times.
 *
 * Renders a time string with seconds in a lighter colour so that
 * hours and minutes remain the visual focus.
 *
 * Example: "1:00:58 PM" → "1:00" normal + ":58" muted + " PM"
 *
 * Used by: time-clock/page.tsx, attendance/page.tsx
 */

interface TimeDisplayProps {
  value: string;
}

export const TimeDisplay = ({ value }: TimeDisplayProps) => {
  if (!value || value === '-') return <span>{value}</span>;

  // Match pattern like "1:00:58 PM" → groups: "1:00", ":58", " PM"
  const match = value.match(/^(\d{1,2}:\d{2})(:(\d{2}))(\s?(AM|PM))?$/i);
  if (!match) return <span>{value}</span>;

  const hhmm = match[1];        // "1:00"
  const seconds = match[3];     // "58"
  const ampm = match[4] || '';  // " PM"

  return (
    <span>
      {hhmm}
      <span className="text-muted-foreground/60">:{seconds}</span>
      {ampm}
    </span>
  );
};
