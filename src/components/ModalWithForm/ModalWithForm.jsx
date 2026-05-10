/**
 * ModalWithForm — reusable modal shell for all form-based dialogs.
 *
 * Renders a titled, accessible modal containing a form. Features:
 *   - Calls onSubmit only when isValid is true (blocks premature submit)
 *   - Shows a server-side error message above the submit button when provided
 *   - Disables and relabels the submit button while isLoading is true
 *   - Optionally renders navigation links to switch between auth modals
 *
 * Accessibility: role="dialog", aria-modal="true", aria-labelledby="modal-title".
 *
 * @param {React.ReactNode} children             - Form fields rendered inside the <form>.
 * @param {string}          title                - Modal heading displayed at the top.
 * @param {string}          buttonText           - Label for the submit button.
 * @param {string}          [loadingText]        - Label shown while isLoading is true.
 * @param {boolean}         isOpen               - Whether the modal is visible.
 * @param {Function}        onSubmit             - Called when the form submits and isValid.
 * @param {Function}        onClose              - Called when the X button is clicked.
 * @param {boolean}         isLoading            - Disables and relabels the submit button.
 * @param {boolean}         isValid              - Prevents submit when false.
 * @param {string}          [serverError]        - Server error message to display.
 * @param {Function}        [onNavigateLogin]    - If provided, shows a "Log in" link.
 * @param {Function}        [onNavigateRegister] - If provided, shows a "Sign up" link.
 */

import "./ModalWithForm.css";

// Reusable modal shell for all form-based dialogs.
// Handles submit prevention, loading state on the button, server-side error display,
// and optional navigation links between auth modals (login ↔ register).
function ModalWithForm({
  children,
  title,
  buttonText,
  loadingText = "Saving...",
  isOpen,
  onSubmit,
  onClose,
  isLoading,
  isValid,
  serverError,
  onNavigateLogin,
  onNavigateRegister,
}) {
  // Prevent native form submission; validate before calling the parent handler
  const handleSubmit = (evt) => {
    evt.preventDefault();
    if (!isValid) {
      return;
    } else {
      onSubmit();
    }
  };

  return (
    <div
      className={`modal ${isOpen ? "modal_opened" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal__container">
        <h2 className="modal__title" id="modal-title">
          {title}
        </h2>
        <button
          onClick={onClose}
          type="button"
          className="modal__close-btn"
        ></button>
        <form onSubmit={handleSubmit} className="modal__form" noValidate>
          {children}
          {serverError && <p className="modal__server-error">{serverError}</p>}
          <div className="modal__button-container">
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`modal__submit-btn ${
                !isValid ? "modal__submit-btn_disabled" : ""
              }`}
            >
              {isLoading ? loadingText : buttonText}
            </button>
            {onNavigateLogin && (
              <p className="modal__link-text">
                or{" "}
                <button
                  type="button"
                  className="modal__link-button"
                  onClick={onNavigateLogin}
                >
                  Log in
                </button>
              </p>
            )}
            {onNavigateRegister && (
              <p className="modal__link-text">
                or{" "}
                <button
                  type="button"
                  className="modal__link-button"
                  onClick={onNavigateRegister}
                >
                  Register
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalWithForm;
