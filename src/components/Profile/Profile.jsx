import "./Profile.css";
import SideBar from "../SideBar/SideBar";

// Authenticated profile page. Renders the sidebar alongside the main content area.
function Profile({ onLogout, onOpenUpdateModal }) {
  return (
    <section className="profile">
      <SideBar onLogout={onLogout} onOpenUpdateModal={onOpenUpdateModal} />
      <div className="clothes-section">
        <div className="clothes-section__row">
          <p className="clothes-section__text">No project-specific data yet.</p>
        </div>
      </div>
    </section>
  );
}
export default Profile;
