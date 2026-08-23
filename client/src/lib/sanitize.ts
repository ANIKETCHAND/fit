/**
 * FitTrack Security Utilities
 * Input sanitization, XSS prevention, and strict format validation.
 */

/**
 * Strips HTML tags, script markers, and dangerous characters from user input strings.
 */
export function sanitizeText(input: string | undefined | null): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

/**
 * Validates and normalizes email addresses.
 */
export function sanitizeEmail(email: string | undefined | null): string {
  if (!email) return "";
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(cleaned) ? cleaned : "";
}

/**
 * Validates positive numerical inputs (weights, reps, calories, distances).
 */
export function sanitizePositiveNumber(val: any, fallback = 0): number {
  const num = Number(val);
  return !isNaN(num) && num >= 0 && isFinite(num) ? num : fallback;
}
