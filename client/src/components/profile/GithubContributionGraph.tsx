import { useMemo, useState } from "react";
import "./GithubContributionGraph.css";

type Year = 2026 | 2025 | 2024;

interface DayCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

const MONTHS = [
  "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"
];

function getRecordedActivities(): Map<string, number> {
  const map = new Map<string, number>();
  const addDate = (raw?: string) => {
    if (!raw) return;
    try {
      const dateStr = raw.includes("T") ? raw.split("T")[0] : raw;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        map.set(dateStr, (map.get(dateStr) || 0) + 1);
      }
    } catch {}
  };

  try {
    const workouts: any[] = JSON.parse(localStorage.getItem("fittrack_workout_logs") || "[]");
    workouts.forEach((w) => addDate(w.completedAt || w.date || w.startedAt));
  } catch {}
  try {
    const gps: any[] = JSON.parse(localStorage.getItem("fittrack_gps_sessions") || "[]");
    gps.forEach((g) => addDate(g.startedAt || g.completedAt || g.date));
  } catch {}
  try {
    const sessions: any[] = JSON.parse(localStorage.getItem("fittrack_sessions") || "[]");
    sessions.forEach((s) => addDate(s.completedAt || s.startedAt || s.date));
  } catch {}
  return map;
}

export function GithubContributionGraph() {
  const [selectedYear, setSelectedYear] = useState<Year>(2026);
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // Compute 53 weeks dynamically for the selected year
  const { weeks, totalCount } = useMemo(() => {
    const activityMap = getRecordedActivities();
    const totalWeeks = 53;
    const grid: DayCell[][] = [];
    let sum = 0;

    // Start date for the 53 weeks grid
    // For 2026, 52 weeks window ending today / end of year
    const today = new Date();
    const isCurrentYear = selectedYear === today.getFullYear();
    const endDate = isCurrentYear ? today : new Date(selectedYear, 11, 31);
    
    // Align start to 52 weeks prior on Sunday
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (totalWeeks * 7 - 1));
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek); // move to Sunday

    const cursor = new Date(startDate);

    for (let w = 0; w < totalWeeks; w++) {
      const week: DayCell[] = [];
      for (let d = 0; d < 7; d++) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, "0");
        const dayNum = String(cursor.getDate()).padStart(2, "0");
        const dateKey = `${y}-${m}-${dayNum}`;
        const count = activityMap.get(dateKey) || 0;
        sum += count;

        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count >= 4) level = 4;
        else if (count === 3) level = 3;
        else if (count === 2) level = 2;
        else if (count === 1) level = 1;

        week.push({ date: dateKey, count, level });
        cursor.setDate(cursor.getDate() + 1);
      }
      grid.push(week);
    }
    return { weeks: grid, totalCount: sum };
  }, [selectedYear]);

  const yearHeaderText = selectedYear === 2026 
    ? `${totalCount} contribution${totalCount === 1 ? "" : "s"} in the last year`
    : `${totalCount} contribution${totalCount === 1 ? "" : "s"} in ${selectedYear}`;

  return (
    <div className="gh-contribution-section">
      <div className="gh-contribution-main">
        {/* Top Header */}
        <div className="gh-contribution-topbar">
          <span className="gh-contribution-title">
            {yearHeaderText}
          </span>
        </div>

        {/* Boxed Heatmap Canvas */}
        <div className="gh-contribution-box">
          {/* Month labels header */}
          <div className="gh-months-header">
            {MONTHS.map((m, idx) => (
              <span key={`${m}-${idx}`} className="gh-month-label">
                {m}
              </span>
            ))}
          </div>

          <div className="gh-grid-wrapper">
            {/* Day of week labels */}
            <div className="gh-days-column">
              <span className="gh-day-label"></span>
              <span className="gh-day-label">Mon</span>
              <span className="gh-day-label"></span>
              <span className="gh-day-label">Wed</span>
              <span className="gh-day-label"></span>
              <span className="gh-day-label">Fri</span>
              <span className="gh-day-label"></span>
            </div>

            {/* Heatmap grid */}
            <div className="gh-cells-grid">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="gh-week-column">
                  {week.map((cell, dIdx) => (
                    <div
                      key={dIdx}
                      className={`gh-cell level-${cell.level}`}
                      data-count={cell.count}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredCell({
                          date: cell.date,
                          count: cell.count,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                        });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Footer with link & legend */}
          <div className="gh-contribution-footer">
            <a
              href="#learn-contributions"
              className="gh-learn-link"
              onClick={(e) => e.preventDefault()}
            >
              Learn how we count contributions
            </a>

            <div className="gh-legend">
              <span className="gh-legend-label">Less</span>
              <div className="gh-legend-cell level-0" />
              <div className="gh-legend-cell level-1" />
              <div className="gh-legend-cell level-2" />
              <div className="gh-legend-cell level-3" />
              <div className="gh-legend-cell level-4" />
              <span className="gh-legend-label">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Year Navigation Tabs */}
      <div className="gh-years-nav">
        {([2026, 2025, 2024] as const).map((year) => (
          <button
            key={year}
            type="button"
            className={`gh-year-btn ${selectedYear === year ? "active" : ""}`}
            onClick={() => setSelectedYear(year)}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Floating Tooltip */}
      {hoveredCell && (
        <div
          className="gh-tooltip"
          style={{
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y}px`,
          }}
        >
          {hoveredCell.count === 0
            ? "No contributions"
            : `${hoveredCell.count} contribution${hoveredCell.count > 1 ? "s" : ""}`}
        </div>
      )}
    </div>
  );
}
