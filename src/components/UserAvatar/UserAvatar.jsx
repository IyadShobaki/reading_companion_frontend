import { useState } from "react";

function UserAvatar({ username, avatar, className }) {
  const [avatarError, setAvatarError] = useState(false);

  if (avatar && !avatarError) {
    return (
      <img
        src={avatar}
        alt={username ? `${username}'s avatar` : "User avatar"}
        className={className}
        onError={() => setAvatarError(true)}
      />
    );
  }

  return (
    <span
      className={`${className} ${className}_none`}
      aria-label={username ? `${username}'s avatar` : "User avatar"}
    >
      {username?.toUpperCase().charAt(0) || ""}
    </span>
  );
}

export default UserAvatar;
