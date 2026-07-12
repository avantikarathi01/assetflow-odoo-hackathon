export function roleName(role: unknown): string | null {
  if (typeof role === "string") return role;
  if (!role || typeof role !== "object") return null;

  const value = role as { name?: unknown; role?: { name?: unknown } };
  if (typeof value.name === "string") return value.name;
  if (typeof value.role?.name === "string") return value.role.name;

  return null;
}

export function roleNames(roles: unknown): string[] {
  if (!Array.isArray(roles)) return [];
  return roles.map(roleName).filter((role): role is string => Boolean(role));
}

export function primaryRole(roles: unknown): string {
  return roleNames(roles)[0] || "EMPLOYEE";
}
