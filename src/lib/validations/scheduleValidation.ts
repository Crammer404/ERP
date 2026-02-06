export interface ScheduleValidationData {
  scheduleName: string;
  branchId: string;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  nightStart: string;
  nightEnd: string;
  gracePeriod: string;
  overtimeThreshold: string;
  selectedEmployees?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidNumber(value: string, min: number = 0): boolean {
  const num = parseInt(value);
  return !isNaN(num) && num >= min;
}

export function hasAtLeastOneShift(data: ScheduleValidationData): boolean {
  const hasMorning = isNotEmpty(data.morningStart) && isNotEmpty(data.morningEnd);
  const hasAfternoon = isNotEmpty(data.afternoonStart) && isNotEmpty(data.afternoonEnd);
  const hasNight = isNotEmpty(data.nightStart) && isNotEmpty(data.nightEnd);
  
  return hasMorning || hasAfternoon || hasNight;
}

export function isValidTimeRange(start: string, end: string): boolean {
  // Both must be filled or both must be empty
  const startFilled = isNotEmpty(start);
  const endFilled = isNotEmpty(end);
  
  if (startFilled !== endFilled) {
    return false; // One is filled but not the other
  }
  
  return true; // Both filled or both empty
}

export function validateScheduleForm(data: ScheduleValidationData): ValidationResult {
  const errors: Record<string, string> = {};

  // Required: Schedule Name
  if (!isNotEmpty(data.scheduleName)) {
    errors.scheduleName = 'Schedule name is required';
  }

  // Required: Branch ID
  if (!isNotEmpty(data.branchId)) {
    errors.branchId = 'Branch is required';
  }

  // Required: Grace Period
  if (!isNotEmpty(data.gracePeriod)) {
    errors.gracePeriod = 'Grace period is required';
  } else if (!isValidNumber(data.gracePeriod, 0)) {
    errors.gracePeriod = 'Grace period must be a valid number (0 or greater)';
  }

  // Required: Overtime Threshold
  if (!isNotEmpty(data.overtimeThreshold)) {
    errors.overtimeThreshold = 'Overtime threshold is required';
  } else if (!isValidNumber(data.overtimeThreshold, 0)) {
    errors.overtimeThreshold = 'Overtime threshold must be a valid number (0 or greater)';
  }

  // Validate time ranges for each shift
  if (!isValidTimeRange(data.morningStart, data.morningEnd)) {
    errors.morningShift = 'Both start and end times are required for morning shift';
  }

  if (!isValidTimeRange(data.afternoonStart, data.afternoonEnd)) {
    errors.afternoonShift = 'Both start and end times are required for afternoon shift';
  }

  if (!isValidTimeRange(data.nightStart, data.nightEnd)) {
    errors.nightShift = 'Both start and end times are required for night shift';
  }

  // Required: At least one complete shift
  if (!hasAtLeastOneShift(data)) {
    errors.shifts = 'At least one shift (Morning, Afternoon, or Night) must be configured with both start and end times';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

