export interface AuthUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

function initialsFor(user: AuthUser): string {
  const label = user.name || user.email || "Artham learner";
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserAvatar({
  user,
  size = 36,
}: {
  user: AuthUser;
  size?: number;
}) {
  const initials = initialsFor(user) || "A";
  // The size is dynamic, so it is applied inline; `flex-basis` keeps the
  // avatar from being squashed by a flex row, and `aspect-square` keeps the
  // circle round even for a non-square source image.
  const box = { width: size, height: size, flex: `0 0 ${size}px` };

  if (user.image) {
    return (
      // Google profile images are user-specific external URLs; keep this as a
      // plain img so auth does not require every provider hostname in Next config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt={user.name || user.email || "Signed-in user"}
        referrerPolicy="no-referrer"
        style={box}
        className="aspect-square shrink-0 rounded-full border border-ink/10 bg-white object-cover shadow-[0_3px_0_rgba(23,23,23,0.08)]"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="grid aspect-square shrink-0 place-items-center rounded-full border border-ink/10 bg-primary text-[13px] font-extrabold text-primary-ink shadow-[0_3px_0_var(--press)]"
      style={box}
    >
      {initials}
    </span>
  );
}
