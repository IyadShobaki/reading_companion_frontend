/**
 * SideBar — profile page sidebar component.
 *
 * Displays the authenticated user's avatar (with a first-letter placeholder
 * fallback when no image is available), their display name, and two account
 * action buttons: "Change profile data" and "Log out".
 *
 * @param {Function} onLogout          - Called when the user clicks "Log out".
 * @param {Function} onOpenUpdateModal - Called when the user clicks "Change profile data".
 */

import "./SideBar.css";
import { useContext } from "react";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";
import UserAvatar from "../UserAvatar/UserAvatar";

// Profile page sidebar showing the user's avatar, name, and account actions.
function SideBar({ onLogout, onOpenUpdateModal }) {
  const { currentUser } = useContext(CurrentUserContext);

  const username = currentUser?.name;
  const avatar = currentUser?.avatar;
  return (
    <aside className="sidebar">
      <div className="sidebar__profile">
        <p className="sidebar__username">{username}</p>
        <UserAvatar
          username={username}
          avatar={avatar}
          className="sidebar__avatar"
        />
      </div>
      <div className="sidebar__actions">
        <button
          type="button"
          className="sidebar__btn"
          onClick={onOpenUpdateModal}
        >
          Change profile data
        </button>
        <button type="button" className="sidebar__btn" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}

export default SideBar;
