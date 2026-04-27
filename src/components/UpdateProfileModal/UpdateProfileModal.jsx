import { useContext, useEffect } from "react";
import "./UpdateProfileModal.css";
import ModalWithForm from "../ModalWithForm/ModalWithForm";
import { useFormWithValidation } from "../../hooks/useFormWithValidation";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";

// Dialog for editing the user's name and avatar URL.
// Pre-populates with the current user's data whenever the modal opens.
// Avatar is optional — an empty string is a valid value (no avatar set).
function UpdateProfileModal({
  isOpen,
  onUpdate,
  onClose,
  isLoading,
  serverError,
}) {
  const { currentUser } = useContext(CurrentUserContext);

  const defaultValues = {
    name: "",
    avatar: "",
  };

  const { values, errors, isValid, handleChange, resetForm, setValues } =
    useFormWithValidation(defaultValues, ["avatar"]);

  useEffect(() => {
    if (isOpen && currentUser) {
      setValues({
        name: currentUser.name || "",
        avatar: currentUser.avatar || "",
      });
    }
  }, [isOpen, currentUser, setValues]);

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      await onUpdate({
        name: values.name,
        avatar: values.avatar,
      });
      resetForm();
      onClose();
    } catch {
      // error surfaced via serverError prop from useAuth
    }
  };

  return (
    <ModalWithForm
      title="Change Profile Data"
      buttonText="Save changes"
      isOpen={isOpen}
      onSubmit={handleSubmit}
      onClose={onClose}
      isLoading={isLoading}
      isValid={isValid}
      serverError={serverError}
    >
      <label
        htmlFor="update-name"
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
          id="update-name"
          autoComplete="name"
          placeholder="Name"
          required
          value={values.name}
          onChange={handleChange}
        />
      </label>
      <label
        htmlFor="update-avatar"
        className={`modal__label ${
          errors.avatar.length > 0 ? "modal__label_type_error" : ""
        }`}
      >
        {errors.avatar.length > 0
          ? `Avatar URL* (${errors.avatar.replace(".", "")})`
          : "Avatar URL*"}
        <input
          type="url"
          name="avatar"
          className={`modal__input ${
            errors.avatar.length > 0 ? "modal__input_type_error" : ""
          }`}
          id="update-avatar"
          placeholder="Avatar URL"
          required
          value={values.avatar}
          onChange={handleChange}
        />
      </label>
    </ModalWithForm>
  );
}

export default UpdateProfileModal;
