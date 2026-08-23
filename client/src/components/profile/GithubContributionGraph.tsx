import { useMemo, useState } from "react";
import "./GithubContributionGraph.css";

interface DayCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface MonthMarker {
  name: string;
  colIndex: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

import { getScopedKey } from "@/lib/user-store";

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
    const workouts: any[] = JSON.parse(localStorage.getItem(getScopedKey("fittrack_workout_logs")) || "[]");
    workouts.forEach((w) => addDate(w.completedAt || w.date || w.startedAt));
  } catch {}
  try {
    const gps: any[] = JSON.parse(localStorage.getItem(getScopedKey("fittrack_gps_sessions")) || "[]");
    gps.forEach((g) => addDate(g.startedAt || g.completedAt || g.date));
  } catch {}
  try {
    const sessions: any[] = JSON.parse(localStorage.getItem(getScopedKey("fittrack_sessions")) || "[]");
    sessions.forEach((s) => addDate(s.completedAt || s.startedAt || s.date));
  } catch {}
  return map;
}

export function GithubContributionGraph() {
  const currentYear = new Date().getFullYear();

  // Dynamic available years based on user's logged activity
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    const activityMap = getRecordedActivities();
    activityMap.forEach((_, dateStr) => {
      const y = parseInt(dateStr.split("-")[0]);
      if (!isNaN(y) && y >= 2020 && y <= currentYear) {
        years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || currentYear);
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // Compute 53 weeks dynamically for the selected year with month markers
  const { weeks, monthMarkers, totalCount } = useMemo(() => {
    const activityMap = getRecordedActivities();
    const totalWeeks = 53;
    const grid: DayCell[][] = [];
    const markers: MonthMarker[] = [];
    let sum = 0;
    let lastMonth = -1;

    const today = new Date();
    const isCurrentYear = selectedYear === today.getFullYear();
    const endDate = isCurrentYear ? today : new Date(selectedYear, 11, 31);

    // Align start to 52 weeks prior on Sunday
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (totalWeeks * 7 - 1));
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const cursor = new Date(startDate);

    for (let w = 0; w < totalWeeks; w++) {
      const week: DayCell[] = [];
      const colMonth = cursor.getMonth();

      // Check if this week marks a new month (at least 2 weeks apart)
      if (colMonth !== lastMonth) {
        const prevMarker = markers[markers.length - 1];
        if (!prevMarker || w - prevMarker.colIndex >= 2) {
          markers.push({
            name: MONTH_NAMES[colMonth],
            colIndex: w,
          });
          lastMonth = colMonth;
        }
      }

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
    return { weeks: grid, monthMarkers: markers, totalCount: sum };
  }, [selectedYear]);

  const yearHeaderText = selectedYear === currentYear
    ? `${totalCount} contribution${totalCount === 1 ? "" : "s"} in the last year`
    : `${totalCount} contribution${totalCount === 1 ? "" : "s"} in ${selectedYear}`;

  const CELL_SIZE = 10;
  const CELL_GAP = 3;
  const LEFT_OFFSET = 30;
  const TOP_OFFSET = 20;
  const STRIDE = CELL_SIZE + CELL_GAP; // 13px

  const svgWidth = LEFT_OFFSET + weeks.length * STRIDE + 8;
  const svgHeight = TOP_OFFSET + 7 * STRIDE + 6;

  return (
    <div className="gh-contribution-section">
      <div className="gh-contribution-main">
        {/* Top Header */}
        <div className="gh-contribution-topbar">
          <span className="gh-contribution-title">
            {yearHeaderText}
          </span>
        </div>

        {/* Boxed Heatmap Canvas with Pixel-Perfect Alignment */}
        <div className="gh-contribution-box">
          <div className="gh-svg-scroll-container">
            <svg
              className="gh-heatmap-svg"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              width={svgWidth}
              height={svgHeight}
              role="img"
              aria-label="Training contribution heatmap"
            >
              {/* Month Header Labels Aligned to Exact Week Columns */}
              {monthMarkers.map((marker, i) => (
                <text
                  key={`${marker.name}-${i}`}
                  x={LEFT_OFFSET + marker.colIndex * STRIDE}
                  y={12}
                  className="gh-svg-month-label"
                >
                  {marker.name}
                </text>
              ))}

              {/* Day of Week Labels */}
              <text x={0} y={TOP_OFFSET + 1 * STRIDE + 8} className="gh-svg-day-label">Mon</text>
              <text x={0} y={TOP_OFFSET + 3 * STRIDE + 8} className="gh-svg-day-label">Wed</text>
              <text x={0} y={TOP_OFFSET + 5 * STRIDE + 8} className="gh-svg-day-label">Fri</text>

              {/* Heatmap 53x7 Grid Cells */}
              {weeks.map((week, wIdx) => {
                const colX = LEFT_OFFSET + wIdx * STRIDE;
                return (
                  <g key={`w-${wIdx}`}>
                    {week.map((cell, dIdx) => {
                      const cellY = TOP_OFFSET + dIdx * STRIDE;
                      return (
                        <rect
                          key={`c-${wIdx}-${dIdx}`}
                          x={colX}
                          y={cellY}
                          width={CELL_SIZE}
                          height={CELL_SIZE}
                          rx={1.5}
                          ry={1.5}
                          className={`gh-svg-cell level-${cell.level}`}
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
                      );
                    })}
                  </g>
                );
              })}
            </svg>
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

      {/* Right Year Navigation Tabs - Only for years with activity */}
      <div className="gh-years-nav">
        {availableYears.map((year) => (
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
            ? `No contributions on ${hoveredCell.date}`
            : `${hoveredCell.count} contribution${hoveredCell.count > 1 ? "s" : ""} on ${hoveredCell.date}`}
        </div>
      )}
    </div>
  );
}
