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
import NotFound from "../NotFound/NotFound";
import AllNotes from "../AllNotes/AllNotes";
import { ToastProvider } from "../Toast/ToastProvider";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";
import { LibraryContext } from "../../contexts/LibraryContext";
import { useAuth } from "../../hooks/useAuth";
import { useModal } from "../../hooks/useModal";
import { useLibrary } from "../../hooks/useLibrary";
import { useUser } from "../../hooks/useUser";

// Root application component.
// Owns auth state (via useAuth), modal state (via useModal), and routing logic.
// Passes data down through context and props rather than a global state library.
//
// Split into two components so that ToastProvider is mounted before any hook
// that calls useToast() (e.g. useLibrary, useNotes via Reader).
// AppShell provides the provider; AppInner holds all the stateful logic.

function AppInner() {
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
    updateCurrentUser,
    clearError,
  } = useAuth();
  const {
    updateProfile,
    isLoading: isProfileLoading,
    error: profileError,
    clearError: clearProfileError,
  } = useUser(updateCurrentUser);
  const { activeModal, openModal, closeModal } = useModal();
  const library = useLibrary();

  // Stable references for the isLoggedIn effect dep array —
  // both are useCallback with [] deps so their identities never change.
  const { fetchLibrary, clearLibrary } = library;

  // Show a banner after automatic logout due to expired session
  const [sessionExpired, setSessionExpired] = useState(false);

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
    setSessionExpired(false);
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
    // Library is fetched by the isLoggedIn effect below — no explicit call needed
  };

  // After registration always land on the home page, not the previously attempted route
  const handleRegister = async (credentials) => {
    await signup(credentials);
    closeModal();
    navigate("/");
    // Library is fetched by the isLoggedIn effect below — no explicit call needed
  };

  // Clear library state on logout so stale data never leaks between accounts.
  // clearLibrary is called here for immediate UI feedback; the isLoggedIn
  // effect below would also clear it but on the next render cycle.
  const handleLogout = useCallback(() => {
    logout();
    clearLibrary();
    navigate("/");
  }, [logout, clearLibrary, navigate]);

  // Memoised so the Escape/overlay effect does not re-register on every render.
  // Also clears any server error so stale messages don't linger between opens.
  const handleCloseModal = useCallback(() => {
    closeModal();
    clearError();
    clearProfileError();
  }, [closeModal, clearError, clearProfileError]);

  // Listen for 401 responses dispatched by ApiClient and perform a clean logout.
  // This covers expired tokens in any hook (library, notes, progress, AI) without
  // each hook needing its own logout logic.
  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
      clearLibrary();
      navigate("/");
      setSessionExpired(true);
    };

    window.addEventListener("auth:expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:expired", handleSessionExpired);
    };
  }, [logout, clearLibrary, navigate]);

  // Attempt to restore an existing session from a stored JWT on initial mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // When a user was redirected here from a protected route (ProtectedRoute sets
  // location.state.from), open the login modal once session restoration finishes
  // and it is confirmed the user is not logged in.
  const fromPath = location.state?.from?.pathname;
  useEffect(() => {
    if (!isLoading && !isLoggedIn && fromPath) {
      openModal("login");
    }
  }, [isLoading, isLoggedIn, fromPath, openModal]);

  // Fetch the library whenever the user becomes authenticated (login, registration,
  // or session restoration) and clear it when they sign out.
  // Using stable fetchLibrary/clearLibrary references (both are useCallback [])
  // means this effect fires only when isLoggedIn actually changes.
  useEffect(() => {
    if (isLoggedIn) {
      fetchLibrary();
    } else {
      clearLibrary();
    }
  }, [isLoggedIn, fetchLibrary, clearLibrary]);

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
        <div
          className={`page${
            location.pathname.startsWith("/reader/") ? " page_reader" : ""
          }`}
        >
          <div className="page__content">
            {sessionExpired && (
              <div className="page__session-banner" role="alert">
                Your session has expired. Please sign in again.
                <button
                  type="button"
                  className="page__session-banner-close"
                  aria-label="Dismiss"
                  onClick={() => setSessionExpired(false)}
                >
                  ✕
                </button>
              </div>
            )}
            <Header
              handleLoginClick={handleLoginClick}
              handleRegisterClick={handleRegisterClick}
              onLogout={handleLogout}
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
              <Route
                path="/notes"
                element={
                  <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
                    <AllNotes />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
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
            onUpdate={updateProfile}
            onClose={handleCloseModal}
            isLoading={isProfileLoading}
            serverError={profileError}
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

// AppShell mounts ToastProvider so that AppInner and all its hooks
// (useLibrary → useToast, Reader → useToast, etc.) have a real context value.
function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

export default App;
