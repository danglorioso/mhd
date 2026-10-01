export const SESSION_TTL_SECONDS = 45 * 60;
// Neon's Free plan caps a project at 10 branches total. Reserve 1 for the
// pristine seed branch and 1 for the permanent shared-overflow branch,
// leaving 8 for real per-visitor sessions.
export const MAX_SESSION_BRANCHES = 8;
// How long the shared-overflow branch's data is allowed to sit before the
// next visitor routed to it triggers a truncate + reseed.
export const SHARED_RESET_INTERVAL_SECONDS = 15 * 60;
