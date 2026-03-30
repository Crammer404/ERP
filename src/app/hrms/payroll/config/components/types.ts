export type RateCategory = 'earnings' | 'deductions';

export type RateFormErrors = Partial<
  Record<'label' | 'group' | 'category' | 'is_rate' | 'value' | 'code', string>
>;

export type SectionInfoKey =
  | 'basePay'
  | 'payrollItems'
  | 'additionalCompensation'
  | 'deductions'
  | 'totalComputation';

export interface RateItem {
  id?: number;
  group: string;
  category?: RateCategory;
  code: string;
  label: string;
  value: number;
  is_rate: 0 | 1;
  assigned_count?: number;
}

export interface NewRateDraft {
  code: string;
  label: string;
  value: string;
  is_rate: 0 | 1;
  group: string;
  category: RateCategory;
}

export interface EditRateDraft {
  code: string;
  label: string;
  value: string;
  is_rate: 0 | 1;
  group?: string;
  category?: RateCategory;
  original_group?: string;
}
