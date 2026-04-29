import { useContext } from "react";
import { Link } from "react-router-dom";
import "./Profile.css";
import SideBar from "../SideBar/SideBar";
import { LibraryContext } from "../../contexts/LibraryContext";

/**
 * Profile page — protected route for authenticated users.
 *
 * Shows the sidebar (avatar, name, edit/logout actions) on the left and a
 * reading-stats panel on the right. Stats are derived from LibraryContext so
 * they stay in sync with the rest of the app without an extra fetch.
 *
 * @param {Function} onLogout          - Called when the user clicks "Log out".
 * @param {Function} onOpenUpdateModal - Called when the user clicks "Change profile data".
 */
function Profile({ onLogout, onOpenUpdateModal }) {
  const { savedBooks } = useContext(LibraryContext);

  return (
    <section className="profile">
      <SideBar onLogout={onLogout} onOpenUpdateModal={onOpenUpdateModal} />

      <div className="profile__content">
        <section className="profile__stats" aria-label="Reading stats">
          <div className="profile__stat-card">
            <p className="profile__stat-value">{savedBooks.length}</p>
            <p className="profile__stat-label">Books saved</p>
          </div>
        </section>

        <Link to="/library" className="profile__library-link">
          View My Library
        </Link>
      </div>
    </section>
  );
}

export default Profile;
