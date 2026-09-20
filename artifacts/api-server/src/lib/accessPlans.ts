export type AccessPlan = "lifetime" | "fixed_days" | "monthly" | "yearly";

export function accessExpiry(
  plan: AccessPlan,
  accessDays: number | null | undefined,
  trialDays = 0,
  from = new Date(),
) {
  const days = trialDays > 0
    ? trialDays
    : plan === "fixed_days"
      ? Number(accessDays)
      : plan === "monthly"
        ? 30
        : plan === "yearly"
          ? 365
          : 0;
  return days > 0 ? new Date(from.getTime() + days * 24 * 60 * 60 * 1000) : null;
}

export function validAccessPlan(value: unknown): value is AccessPlan {
  return ["lifetime", "fixed_days", "monthly", "yearly"].includes(String(value));
}

export function activeUntil(expiresAt: Date | null | undefined) {
  return !expiresAt || expiresAt.getTime() > Date.now();
}