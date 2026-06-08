/**
 * UserAvatar — renders a user's avatar image or a first-letter placeholder.
 *
 * When an avatar URL is provided and loads successfully, renders an <img>.
 * When the URL is absent or the image fails to load, renders a circular <span>
 * showing the first letter of the username (or "?" when the name is also absent).
 *
 * @param {string} [username]  - Used for the alt text and the placeholder initial.
 * @param {string} [avatar]    - Avatar image URL. Omit or leave empty to show the placeholder.
 * @param {string} [className] - Additional CSS class applied to both the img and placeholder.
 */

import { useState } from "react";
import "./UserAvatar.css";

function UserAvatar({ username, avatar, className }) {
  const [avatarError, setAvatarError] = useState(false);

  if (avatar && !avatarError) {
    return (
      <img
        src={avatar}
        alt={username ? `${username}'s avatar` : "User avatar"}
        className={`user-avatar ${className ?? ""}`.trim()}
        onError={() => setAvatarError(true)}
      />
    );
  }

  const initial = username?.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={`user-avatar__placeholder ${className ?? ""}`.trim()}
      aria-label={username ? `${username}'s avatar` : "User avatar"}
      role="img"
    >
      {initial}
    </span>
  );
}

export default UserAvatar;
