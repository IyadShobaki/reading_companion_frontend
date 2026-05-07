import { useContext, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import "./Header.css";
import logo from "../../assets/images/logo.svg";
import UserAvatar from "../UserAvatar/UserAvatar";

import { CurrentUserContext } from "../../contexts/CurrentUserContext";

// Computed once at module scope — refreshes only on page load, not on every render
const currentDate = new Date().toLocaleString("default", {
  month: "long",
  day: "numeric",
});

// Top navigation bar. Renders auth buttons for guests or a profile link for
// logged-in users. The mobile nav closes automatically on route change.
// Includes a search form that navigates to /search?q=… on submission.
function Header({ handleLoginClick, handleRegisterClick, isLoggedIn }) {
  const { currentUser } = useContext(CurrentUserContext);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Close the mobile nav whenever the user navigates to a different route.
  // Uses React's derived-state pattern (render-phase setState) instead of an
  // effect to avoid setting state synchronously inside useEffect.
  const [prevLocation, setPrevLocation] = useState(location);
  if (prevLocation !== location) {
    setPrevLocation(location);
    setIsNavOpen(false);
  }

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
            <NavLink className="header__nav-link" to="/profile">
              <div className="header__user-container">
                <p className="header__username">{username}</p>
                <UserAvatar
                  username={username}
                  avatar={avatar}
                  className="header__avatar"
                />
              </div>
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
