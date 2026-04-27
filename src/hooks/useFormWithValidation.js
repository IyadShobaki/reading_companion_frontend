import { useState, useCallback, useMemo } from "react";

export const useFormWithValidation = (initialValues, optionalFields = []) => {
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

  const validateField = useCallback(
    (name, value) => {
      let error = "";

      switch (name) {
        case "name":
          if (!value || value.trim().length === 0) {
            error = "Name is required.";
          } else if (value.length > 30) {
            error = "Name must be 30 characters or less.";
          }
          break;

        case "email":
          if (!value || value.trim().length === 0) {
            error = "Email is required.";
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              error = "Please enter a valid email.";
            }
          }
          break;

        case "password":
          if (!value || value.trim().length === 0) {
            error = "Password is required.";
          } else if (value.length < 6) {
            error = "Password must be at least 6 characters.";
          }
          break;

        case "confirmPassword":
          if (!value || value.trim().length === 0) {
            error = "Please confirm your password.";
          } else if (value !== values.password) {
            error = "Passwords do not match.";
          }
          break;

        case "imageUrl":
          if (!value || value.trim().length === 0) {
            error = "Image URL is required.";
          } else {
            try {
              new URL(value);
            } catch {
              error = "Please enter a valid URL.";
            }
          }
          break;

        case "avatar":
          if (value && value.trim().length > 0) {
            try {
              new URL(value);
            } catch {
              error = "Please enter a valid URL.";
            }
          }
          break;

        default:
          break;
      }

      return error;
    },
    [values.password],
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
