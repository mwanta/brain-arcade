import { useState } from 'react';
import { GENDER_OPTIONS } from './genders.js';
import { OCCUPATION_OPTIONS } from './occupations.js';
import { EDUCATION_LEVEL_OPTIONS } from './educationLevels.js';

const EMPTY = { username: '', birthday: '', gender: '', occupation: '', education_level: '' };

// Controlled player form, used to create a player on the login page.
// `onSubmit(values)` should return a promise; ApiError.details are shown per field.
export default function PlayerForm({ initialValues = EMPTY, submitLabel, onSubmit }) {
  const [values, setValues] = useState({
    username: initialValues.username ?? '',
    birthday: initialValues.birthday ?? '',
    gender: initialValues.gender ?? '',
    occupation: initialValues.occupation ?? '',
    education_level: initialValues.education_level ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      await onSubmit({
        username: values.username.trim(),
        birthday: values.birthday || null,
        gender: values.gender || null,
        occupation: values.occupation || null,
        education_level: values.education_level || null,
      });
    } catch (err) {
      setFieldErrors(err.details || {});
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="error" role="alert">
          {formError}
        </div>
      )}

      <label>
        Username
        <input
          name="username"
          value={values.username}
          onChange={handleChange}
          required
          maxLength={50}
        />
        {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
      </label>

      <label>
        Birthday
        <input
          type="date"
          name="birthday"
          value={values.birthday}
          onChange={handleChange}
          required
        />
        {fieldErrors.birthday && <span className="field-error">{fieldErrors.birthday}</span>}
      </label>

      <label>
        Gender
        <select name="gender" value={values.gender} onChange={handleChange}>
          <option value="">— Not specified —</option>
          {GENDER_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
        {fieldErrors.gender && <span className="field-error">{fieldErrors.gender}</span>}
      </label>

      <label>
        Occupation
        <select name="occupation" value={values.occupation} onChange={handleChange}>
          <option value="">— Not specified —</option>
          {OCCUPATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {fieldErrors.occupation && <span className="field-error">{fieldErrors.occupation}</span>}
      </label>

      <label>
        Education level
        <select name="education_level" value={values.education_level} onChange={handleChange}>
          <option value="">— Not specified —</option>
          {EDUCATION_LEVEL_OPTIONS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
        {fieldErrors.education_level && (
          <span className="field-error">{fieldErrors.education_level}</span>
        )}
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
