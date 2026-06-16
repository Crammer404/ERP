export type UserEmploymentStatus =
  | 'active'
  | 'indefinite_leave'
  | 'resigned'
  | 'terminated';

export type InactiveUserEmploymentStatus = Exclude<UserEmploymentStatus, 'active'>;

export const EMPLOYMENT_STATUS_LABELS: Record<UserEmploymentStatus, string> = {
  active: 'Active',
  indefinite_leave: 'Indefinite Leave',
  resigned: 'Resigned',
  terminated: 'Terminated',
};

export const INACTIVE_EMPLOYMENT_STATUS_OPTIONS: Array<{
  value: InactiveUserEmploymentStatus;
  label: string;
}> = [
  { value: 'indefinite_leave', label: EMPLOYMENT_STATUS_LABELS.indefinite_leave },
  { value: 'resigned', label: EMPLOYMENT_STATUS_LABELS.resigned },
  { value: 'terminated', label: EMPLOYMENT_STATUS_LABELS.terminated },
];

export const getEmploymentStatusLabel = (
  status: UserEmploymentStatus | undefined | null,
  isActive?: boolean
): string => {
  if (status && status in EMPLOYMENT_STATUS_LABELS) {
    return EMPLOYMENT_STATUS_LABELS[status];
  }

  if (isActive === false) {
    return 'Inactive';
  }

  return EMPLOYMENT_STATUS_LABELS.active;
};
