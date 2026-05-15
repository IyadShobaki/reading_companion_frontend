/**
 * Header — top navigation bar.
 *
 * Renders the app logo with today's date, a search form that navigates to
 * /search?q=…, and auth/profile controls:
 *   - Guests see "Sign up" and "Log in" buttons.
 *   - Authenticated users see a profile link with their avatar.
 *
 * The mobile hamburger nav closes automatically on any route change.
 *
 * @param {Function} handleLoginClick    - Opens the login modal.
 * @param {Function} handleRegisterClick - Opens the register modal.
 * @param {boolean}  isLoggedIn          - Whether the current user is authenticated.
 * @param {Function} [onLogout]          - Called when the user clicks "Log out".
 */

import { useContext, useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import "./Header.css";
import logo from "../../favicon.svg";
import UserAvatar from "../UserAvatar/UserAvatar";

import { CurrentUserContext } from "../../contexts/CurrentUserContext";

// Computed once at module scope — refreshes only on page load, not on every render
const currentDate = new Date().toLocaleString("default", {
  month: "long",
  day: "numeric",
});

const noop = () => {};

// Top navigation bar. Renders auth buttons for guests or a profile link for
// logged-in users. The mobile nav closes automatically on route change.
// Includes a search form that navigates to /search?q=… on submission.
function Header({
  handleLoginClick,
  handleRegisterClick,
  isLoggedIn,
  onLogout = noop,
  onOpenUpdateModal = noop,
}) {
  const { currentUser } = useContext(CurrentUserContext);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close the mobile nav whenever the user navigates to a different route.
  // Uses React's derived-state pattern (render-phase setState) instead of an
  // effect to avoid setting state synchronously inside useEffect.
  const [prevLocation, setPrevLocation] = useState(location);
  if (prevLocation !== location) {
    setPrevLocation(location);
    setIsNavOpen(false);
    setIsDropdownOpen(false);
  }

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isDropdownOpen]);

  const username = currentUser?.name;
  const avatar = currentUser?.avatar;

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const handleSearchSubmit = (evt) => {
    evt.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="header">
      <NavLink to="/">
        <img src={logo} alt="App Logo" className="header__logo" />
      </NavLink>
      <p className="header__date-and-location">{currentDate}</p>

      <form
        className="header__search-form"
        onSubmit={handleSearchSubmit}
        role="search"
      >
        <input
          className="header__search-input"
          type="search"
          placeholder="Search books…"
          aria-label="Search books"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="header__search-btn"
          type="submit"
          aria-label="Submit search"
        >
          Search
        </button>
      </form>

      <button className="header__toggler-btn" onClick={toggleNav}>
        {isNavOpen ? "\u2715" : "\u2550"}
      </button>
      <nav
        className={`header__toggler ${
          isNavOpen ? "header__toggler_is-active" : ""
        }`}
      >
        {!isLoggedIn && (
          <>
            <button
              onClick={handleRegisterClick}
              type="button"
              className="header__auth-btn header__register-btn"
            >
              Sign up
            </button>
            <button
              onClick={handleLoginClick}
              type="button"
              className="header__auth-btn header__login-btn"
            >
              Log in
            </button>
          </>
        )}
        {isLoggedIn && (
          <>
            <NavLink className="header__nav-link" to="/library">
              My Library
            </NavLink>
            <NavLink className="header__nav-link" to="/notes">
              My Notes
            </NavLink>
            <div className="header__avatar-menu" ref={dropdownRef}>
              <button
                type="button"
                className="header__avatar-trigger"
                onClick={() => setIsDropdownOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
                aria-label="User menu"
              >
                {username && (
                  <span className="header__username" aria-hidden="true">
                    {username}
                  </span>
                )}
                <UserAvatar
                  username={username}
                  avatar={avatar}
                  className="header__avatar"
                />
              </button>
              {isDropdownOpen && (
                <div className="header__dropdown" role="menu">
                  <button
                    type="button"
                    className="header__dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenUpdateModal();
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    className="header__dropdown-item header__dropdown-item_danger"
                    role="menuitem"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
