import { describe, expect, it } from "vitest";
import { formatLocalDateKey, parseDateToLocalKey } from "../client/src/components/profile/GithubContributionGraph";

describe("GithubContributionGraph Date Logic", () => {
  it("formats local Date accurately to YYYY-MM-DD", () => {
    const d = new Date(2026, 8, 1, 22, 45, 0); // Sep 1, 2026 10:45 PM
    expect(formatLocalDateKey(d)).toBe("2026-09-01");
  });

  it("parses pure YYYY-MM-DD string without timezone shifting", () => {
    expect(parseDateToLocalKey("2026-09-01")).toBe("2026-09-01");
    expect(parseDateToLocalKey("2026-01-15")).toBe("2026-01-15");
  });

  it("parses timestamps and Date objects correctly", () => {
    const d = new Date(2026, 8, 1, 10, 0, 0);
    expect(parseDateToLocalKey(d)).toBe("2026-09-01");
    expect(parseDateToLocalKey(d.getTime())).toBe("2026-09-01");
  });

  it("handles null/undefined gracefully", () => {
    expect(parseDateToLocalKey(null)).toBeNull();
    expect(parseDateToLocalKey(undefined)).toBeNull();
    expect(parseDateToLocalKey("")).toBeNull();
  });
});
