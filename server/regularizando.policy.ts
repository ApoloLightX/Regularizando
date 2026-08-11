export const reviewerRoles = ["owner", "admin", "reviewer"] as const;
export const teamManagerRoles = ["owner", "admin"] as const;

export function requireWorkspaceContext<T>(context: T | undefined): T {
  if (!context) throw new Error("Crie ou entre em uma organização para continuar.");
  return context;
}

export function rejectCrossTenantReference(found: boolean) {
  if (!found) throw new Error("O registro informado não pertence à organização atual.");
}

export function canReviewEvidence(role: string) {
  return reviewerRoles.includes(role as (typeof reviewerRoles)[number]);
}

export function canDecideAssignedReview(assignedReviewerUserId: number | null, currentUserId: number) {
  return assignedReviewerUserId === null || assignedReviewerUserId === currentUserId;
}

export function canManageTeam(role: string) {
  return teamManagerRoles.includes(role as (typeof teamManagerRoles)[number]);
}

export function normalizeInvitationEmail(email: string) {
  return email.trim().toLowerCase();
}
