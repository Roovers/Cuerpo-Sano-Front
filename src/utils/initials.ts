export const getInitials = (firstName?: string, lastName?: string, fallback = "CS") => {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.trim();
  return initials || fallback;
};
