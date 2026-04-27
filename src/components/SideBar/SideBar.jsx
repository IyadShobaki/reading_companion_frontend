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
        <button className="sidebar__btn" onClick={onOpenUpdateModal}>
          Change profile data
        </button>
        <button className="sidebar__btn" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}

export default SideBar;
