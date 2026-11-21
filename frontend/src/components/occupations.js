// Mirrors the occupation ENUM in backend/database/schema.sql.
export const OCCUPATION_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
  { value: 'trades', label: 'Trades' },
  { value: 'arts_media', label: 'Arts and media' },
  { value: 'service', label: 'Service' },
  { value: 'retired', label: 'Retired' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'other', label: 'Other' },
];

export const occupationLabel = (value) =>
  OCCUPATION_OPTIONS.find((o) => o.value === value)?.label ?? '—';
