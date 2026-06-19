/**
 * Authentication & RBAC types shared between client and server.
 */

export type Role = "admin" | "engineer" | "viewer";

export const ROLES: Role[] = ["admin", "engineer", "viewer"];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  engineer: "Engineer",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: "Full access — manage users, run chaos, approve autonomous actions.",
  engineer: "Investigate incidents, run analyzer, queue recovery actions.",
  viewer: "Read-only access to dashboards and reports.",
};

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  organization: string;
  role: Role;
  avatar_url: string | null;
  created_at: string;
}

/** Action permissions, derived from role. */
export const PERMISSIONS = {
  canRunChaos: (role: Role) => role === "admin" || role === "engineer",
  canApproveActions: (role: Role) => role === "admin",
  canManageUsers: (role: Role) => role === "admin",
  canEditSettings: (role: Role) => role === "admin",
  canRunAnalyzer: (role: Role) => role !== "viewer",
} as const;
