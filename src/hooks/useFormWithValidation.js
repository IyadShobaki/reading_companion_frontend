import { useState, useCallback, useMemo } from "react";

/**
 * useFormWithValidation — generic form state manager.
 *
 * All validation logic lives in the caller. Pass a `validators` object whose
 * keys are field names and whose values are `(value, allValues) => errorString`
 * functions. Declare `validators` at module scope in each caller so the
 * reference is stable across renders.
 *
 * @param {Object}   initialValues  - Initial field values.
 * @param {string[]} optionalFields - Fields whose empty value does not block submission.
 * @param {Object}   validators     - Map of fieldName → (value, allValues) => errorString.
 */
export const useFormWithValidation = (
  initialValues,
  optionalFields = [],
  validators = {},
) => {
  // Capture initial values once so they remain stable across re-renders.
  // useState only uses its argument on the first render, so this is safe.
  const [defaultValues] = useState(initialValues);
  const [values, setValues] = useState(defaultValues);
  const defaultErrors = useMemo(
    () =>
      Object.keys(defaultValues).reduce((acc, key) => {
        acc[key] = "";
        return acc;
      }, {}),
    [defaultValues],
  );
  const [errors, setErrors] = useState(defaultErrors);

  // Delegate all validation to the caller-supplied validators map.
  // validators is module-scope in each caller (stable reference).
  // values is included in deps for cross-field rules such as confirmPassword.
  const validateField = useCallback(
    (name, value) => validators[name]?.(value, values) ?? "",
    [validators, values],
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    },
    [validateField],
  );

  const isValid =
    !Object.values(errors).some((error) => error.length > 0) &&
    !Object.entries(values).some(
      ([key, value]) =>
        !optionalFields.includes(key) &&
        typeof value === "string" &&
        value.trim().length === 0,
    );

  const resetForm = useCallback(() => {
    setValues(defaultValues);
    setErrors(defaultErrors);
  }, [defaultValues, defaultErrors]);

  return {
    values,
    errors,
    isValid,
    setValues,
    handleChange,
    resetForm,
  };
};
