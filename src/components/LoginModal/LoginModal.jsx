import "./LoginModal.css";
import ModalWithForm from "../ModalWithForm/ModalWithForm";
import { useFormWithValidation } from "../../hooks/useFormWithValidation";

// Login dialog. Server errors (wrong credentials, etc.) are surfaced via the
// `serverError` prop passed down from useAuth rather than local state.
function LoginModal({
  isOpen,
  onLogin,
  onClose,
  isLoading,
  onNavigateRegister,
  serverError,
}) {
  const defaultValues = {
    email: "",
    password: "",
  };

  const { values, errors, isValid, handleChange, resetForm } =
    useFormWithValidation(defaultValues);

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      await onLogin(values);
      resetForm();
    } catch {
      // error surfaced via serverError prop from useAuth
    }
  };

  return (
    <ModalWithForm
      title="Log In"
      buttonText="Log in"
      loadingText="Logging in..."
      isOpen={isOpen}
      onSubmit={handleSubmit}
      onClose={onClose}
      isLoading={isLoading}
      isValid={isValid}
      onNavigateRegister={onNavigateRegister}
      serverError={serverError}
    >
      <label
        htmlFor="login-email"
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
          id="login-email"
          autoComplete="email"
          placeholder="Email"
          required
          value={values.email}
          onChange={handleChange}
        />
      </label>
      <label
        htmlFor="login-password"
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
          id="login-password"
          placeholder="Password"
          required
          value={values.password}
          onChange={handleChange}
        />
      </label>
    </ModalWithForm>
  );
}

export default LoginModal;
