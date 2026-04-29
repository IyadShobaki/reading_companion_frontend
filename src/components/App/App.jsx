import { useCallback, useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import "./App.css";
import Header from "../Header/Header";
import Main from "../Main/Main";
import Footer from "../Footer/Footer";
import LoginModal from "../LoginModal/LoginModal";
import RegisterModal from "../RegisterModal/RegisterModal";
import UpdateProfileModal from "../UpdateProfileModal/UpdateProfileModal";
import BookPreviewModal from "../BookPreviewModal/BookPreviewModal";
import Reader from "../Reader/Reader";
import Profile from "../Profile/Profile";
import Library from "../Library/Library";
import SearchResults from "../SearchResults/SearchResults";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";
import { LibraryContext } from "../../contexts/LibraryContext";
import { useAuth } from "../../hooks/useAuth";
import { useModal } from "../../hooks/useModal";
import { useLibrary } from "../../hooks/useLibrary";

// Root application component.
// Owns auth state (via useAuth), modal state (via useModal), and routing logic.
// Passes data down through context and props rather than a global state library.
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  // Destructure to stable individual references so hook dep arrays are precise
  const {
    isLoggedIn,
    currentUser,
    isLoading,
    error,
    signin,
    signup,
    logout,
    restoreSession,
    updateProfile,
    clearError,
  } = useAuth();
  const { activeModal, openModal, closeModal } = useModal();
  const library = useLibrary();

  // Book whose preview modal is currently open (null = closed)
  const [previewBook, setPreviewBook] = useState(null);

  const handlePreview = (book) => {
    setPreviewBook(book);
    openModal("book-preview");
  };

  const handleClosePreview = useCallback(() => {
    closeModal();
    setPreviewBook(null);
  }, [closeModal]);

  // Where to redirect after login — defaults to "/" if accessed directly
  const redirectPath = location.state?.from?.pathname || "/";

  const handleLoginClick = () => {
    openModal("login");
  };

  const handleRegisterClick = () => {
    openModal("register");
  };

  // After a successful login, navigate to the page the user originally requested
  const handleLogin = async (credentials) => {
    await signin(credentials.email, credentials.password);
    closeModal();
    navigate(redirectPath);
    // Fetch the user's library after login so saved state is immediately available
    library.fetchLibrary();
  };

  // After registration always land on the home page, not the previously attempted route
  const handleRegister = async (credentials) => {
    await signup(credentials);
    closeModal();
    navigate("/");
    // Fetch library after registration (starts empty but keeps the flow consistent)
    library.fetchLibrary();
  };

  const handleUpdateProfile = (updatedData) => updateProfile(updatedData);

  // Clear library state on logout so stale data never leaks between accounts
  const handleLogout = useCallback(() => {
    logout();
    library.clearLibrary();
  }, [logout, library]);

  // Memoised so the Escape/overlay effect does not re-register on every render.
  // Also clears any server error so stale messages don't linger between opens.
  const handleCloseModal = useCallback(() => {
    closeModal();
    clearError();
  }, [closeModal, clearError]);

  // Attempt to restore an existing session from a stored JWT on initial mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Register Escape-key and overlay-click handlers only while a modal is open.
  // Listeners are cleaned up when the modal closes to avoid memory leaks.
  useEffect(() => {
    if (!activeModal) return;

    const handleEscClose = (evt) => {
      if (evt.key === "Escape") {
        handleCloseModal();
      }
    };

    const handleOverlay = (evt) => {
      if (evt.target.classList.contains("modal")) {
        handleCloseModal();
      }
    };

    document.addEventListener("keydown", handleEscClose);
    document.addEventListener("mousedown", handleOverlay);

    return () => {
      document.removeEventListener("keydown", handleEscClose);
      document.removeEventListener("mousedown", handleOverlay);
    };
  }, [activeModal, handleCloseModal]);

  return (
    <CurrentUserContext.Provider value={{ currentUser }}>
      <LibraryContext.Provider value={library}>
        <div className="page">
          <div className="page__content">
            <Header
              handleLoginClick={handleLoginClick}
              handleRegisterClick={handleRegisterClick}
              isLoggedIn={isLoggedIn}
            />
            <Routes>
              <Route
                path="/"
                element={
                  <Main
                    isLoggedIn={isLoggedIn}
                    savedBookIds={library.savedBookIds}
                    onPreview={handlePreview}
                    onAddToLibrary={library.addBook}
                    onRemoveFromLibrary={library.removeBook}
                  />
                }
              />
              <Route
                path="/search"
                element={
                  <SearchResults
                    isLoggedIn={isLoggedIn}
                    savedBookIds={library.savedBookIds}
                    onPreview={handlePreview}
                    onAddToLibrary={library.addBook}
                    onRemoveFromLibrary={library.removeBook}
                  />
                }
              />
              <Route path="/reader/:bookId" element={<Reader />} />
              <Route
                path="/library"
                element={
                  <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
                    <Library
                      onPreview={handlePreview}
                      onAddToLibrary={library.addBook}
                      onRemoveFromLibrary={library.removeBook}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
                    <Profile
                      onLogout={handleLogout}
                      onOpenUpdateModal={() => openModal("update-profile")}
                    />
                  </ProtectedRoute>
                }
              />
            </Routes>

            <Footer />
          </div>
          <LoginModal
            isOpen={activeModal === "login"}
            onLogin={handleLogin}
            onClose={handleCloseModal}
            onNavigateRegister={handleRegisterClick}
            isLoading={isLoading}
            serverError={error}
          />
          <RegisterModal
            isOpen={activeModal === "register"}
            onRegister={handleRegister}
            onClose={handleCloseModal}
            onNavigateLogin={handleLoginClick}
            isLoading={isLoading}
            serverError={error}
          />
          <UpdateProfileModal
            isOpen={activeModal === "update-profile"}
            onUpdate={handleUpdateProfile}
            onClose={handleCloseModal}
            isLoading={isLoading}
            serverError={error}
          />
          <BookPreviewModal
            isOpen={activeModal === "book-preview"}
            book={previewBook}
            isLoggedIn={isLoggedIn}
            isSaved={
              previewBook
                ? library.savedBookIds.includes(previewBook.googleBookId)
                : false
            }
            onClose={handleClosePreview}
            onAddToLibrary={library.addBook}
            onRemoveFromLibrary={library.removeBook}
          />
        </div>
      </LibraryContext.Provider>
    </CurrentUserContext.Provider>
  );
}

export default App;
