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
