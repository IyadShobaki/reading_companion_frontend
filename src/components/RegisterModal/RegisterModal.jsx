import "./RegisterModal.css";
import ModalWithForm from "../ModalWithForm/ModalWithForm";
import { useFormWithValidation } from "../../hooks/useFormWithValidation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation rules for registration fields. Module-scope so the reference is stable.
const REGISTER_VALIDATORS = {
  name: (v) => {
    if (!v || v.trim().length === 0) return "Name is required.";
    if (v.length > 30) return "Name must be 30 characters or less.";
    return "";
  },
  email: (v) => {
    if (!v || v.trim().length === 0) return "Email is required.";
    if (!EMAIL_REGEX.test(v)) return "Please enter a valid email.";
    return "";
  },
  password: (v) => {
    if (!v || v.trim().length === 0) return "Password is required.";
    if (v.length < 6) return "Password must be at least 6 characters.";
    return "";
  },
  avatar: (v) => {
    if (v && v.trim().length > 0) {
      try {
        new URL(v);
      } catch {
        return "Please enter a valid URL.";
      }
    }
    return "";
  },
};

// Registration dialog. Avatar is optional — passed in optionalFields so an
// empty value does not block form submission. Server errors come via the
// `serverError` prop from useAuth.
function RegisterModal({
  isOpen,
  onRegister,
  onClose,
  isLoading,
  onNavigateLogin,
  serverError,
}) {
  const defaultValues = {
    name: "",
    email: "",
    password: "",
    avatar: "",
  };

  const { values, errors, isValid, handleChange, resetForm } =
    useFormWithValidation(defaultValues, ["avatar"], REGISTER_VALIDATORS);

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      await onRegister({
        name: values.name,
        email: values.email,
        password: values.password,
        avatar: values.avatar,
      });
      resetForm();
    } catch {
      // error surfaced via serverError prop from useAuth
    }
  };

  return (
    <ModalWithForm
      title="Sign Up"
      serverError={serverError}
      buttonText="Next"
      loadingText="Signing up..."
      isOpen={isOpen}
      onSubmit={handleSubmit}
      onClose={onClose}
      isLoading={isLoading}
      isValid={isValid}
      onNavigateLogin={onNavigateLogin}
    >
      <label
        htmlFor="register-email"
        className={`modal__label ${
          errors.email.length > 0 ? "modal__label_type_error" : ""
        }`}
      >
        {errors.email.length > 0
          ? `Email* (${errors.email.replace(".", "")})`
          : "Email*"}
        <input
          type="email"
          name="email"
          className={`modal__input ${
            errors.email.length > 0 ? "modal__input_type_error" : ""
          }`}
          id="register-email"
          autoComplete="email"
          placeholder="Email"
          required
          value={values.email}
          onChange={handleChange}
        />
      </label>
      <label
        htmlFor="register-password"
        className={`modal__label ${
          errors.password.length > 0 ? "modal__label_type_error" : ""
        }`}
      >
        {errors.password.length > 0
          ? `Password* (${errors.password.replace(".", "")})`
          : "Password*"}
        <input
          type="password"
          name="password"
          className={`modal__input ${
            errors.password.length > 0 ? "modal__input_type_error" : ""
          }`}
          id="register-password"
          placeholder="Password"
          required
          value={values.password}
          onChange={handleChange}
        />
      </label>
      <label
        htmlFor="register-name"
        className={`modal__label ${
          errors.name.length > 0 ? "modal__label_type_error" : ""
        }`}
      >
        {errors.name.length > 0
          ? `Name* (${errors.name.replace(".", "")})`
          : "Name*"}
        <input
          type="text"
          name="name"
          className={`modal__input ${
            errors.name.length > 0 ? "modal__input_type_error" : ""
          }`}
          id="register-name"
          autoComplete="name"
          placeholder="Name"
          required
          value={values.name}
          onChange={handleChange}
        />
      </label>
      <label
        htmlFor="register-avatar"
        className={`modal__label ${
          errors.avatar.length > 0 ? "modal__label_type_error" : ""
        }`}
      >
        {errors.avatar.length > 0
          ? `Avatar URL (${errors.avatar.replace(".", "")})`
          : "Avatar URL"}
        <input
          type="url"
          name="avatar"
          className={`modal__input ${
            errors.avatar.length > 0 ? "modal__input_type_error" : ""
          }`}
          id="register-avatar"
          placeholder="Avatar URL (optional)"
          value={values.avatar}
          onChange={handleChange}
        />
      </label>
    </ModalWithForm>
  );
}

export default RegisterModal;
