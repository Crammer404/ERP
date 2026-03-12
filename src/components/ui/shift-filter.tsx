import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ShiftFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ShiftFilter({
  value,
  onChange,
  className = 'w-full sm:flex-1 sm:min-w-[120px]',
}: ShiftFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="All Shifts" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Shifts</SelectItem>
        <SelectItem value="Morning">Morning</SelectItem>
        <SelectItem value="Afternoon">Afternoon</SelectItem>
        <SelectItem value="Night">Night</SelectItem>
      </SelectContent>
    </Select>
  );
}
