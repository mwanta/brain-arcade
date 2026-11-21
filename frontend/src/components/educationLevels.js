// Mirrors the education_level ENUM in backend/database/schema.sql (lowest to highest).
export const EDUCATION_LEVEL_OPTIONS = [
  { value: 'less_than_high_school', label: 'Less than high school' },
  { value: 'high_school', label: 'High school' },
  { value: 'some_college', label: 'Some college' },
  { value: 'associate', label: 'Associate degree' },
  { value: 'bachelor', label: "Bachelor's degree" },
  { value: 'master', label: "Master's degree" },
  { value: 'doctorate', label: 'Doctorate' },
];

export const educationLevelLabel = (value) =>
  EDUCATION_LEVEL_OPTIONS.find((e) => e.value === value)?.label ?? '—';
