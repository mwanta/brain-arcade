// Mirrors the ENUM in backend/database/schema.sql.
export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const genderLabel = (value) => GENDER_OPTIONS.find((g) => g.value === value)?.label ?? '—';
