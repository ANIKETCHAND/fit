import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
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

const YEAR_STATS: Record<Year, { count: number; text: string }> = {
  2026: { count: 142, text: "142 contributions in the last year" },
  2025: { count: 198, text: "198 contributions in 2025" },
  2024: { count: 115, text: "115 contributions in 2024" },
};

export function GithubContributionGraph() {
  const [selectedYear, setSelectedYear] = useState<Year>(2026);
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // Generate 53 weeks × 7 days
  const weeks = useMemo(() => {
    const totalWeeks = 53;
    const grid: DayCell[][] = [];

    // Seeded generator based on selectedYear
    for (let w = 0; w < totalWeeks; w++) {
      const week: DayCell[] = [];
      for (let d = 0; d < 7; d++) {
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        let count = 0;

        if (selectedYear === 2026) {
          // Recent weeks (Aug) have high density matching the screenshot
          if (w >= 50) {
            const seed = (w * 13 + d * 7) % 10;
            if (seed > 7) {
              level = 4;
              count = 5;
            } else if (seed > 4) {
              level = 3;
              count = 3;
            } else if (seed > 2) {
              level = 2;
              count = 2;
            } else {
              level = 1;
              count = 1;
            }
          } else if (w >= 46 && (w + d) % 4 === 0) {
            level = 1;
            count = 1;
          } else if (w >= 30 && (w * 7 + d) % 11 === 0) {
            level = 2;
            count = 2;
          }
        } else if (selectedYear === 2025) {
          const seed = (w * 17 + d * 5 + 3) % 13;
          if (seed > 9) {
            level = 3;
            count = 4;
          } else if (seed > 6) {
            level = 2;
            count = 2;
          } else if (seed > 3) {
            level = 1;
            count = 1;
          }
        } else {
          const seed = (w * 19 + d * 3 + 7) % 15;
          if (seed > 11) {
            level = 3;
            count = 3;
          } else if (seed > 8) {
            level = 2;
            count = 2;
          } else if (seed > 5) {
            level = 1;
            count = 1;
          }
        }

        const dateStr = `2026-W${w + 1}-D${d + 1}`;
        week.push({ date: dateStr, count, level });
      }
      grid.push(week);
    }
    return grid;
  }, [selectedYear]);

  return (
    <div className="gh-contribution-section">
      <div className="gh-contribution-main">
        {/* Top Header */}
        <div className="gh-contribution-topbar">
          <span className="gh-contribution-title">
            {YEAR_STATS[selectedYear].text}
          </span>
          <button className="gh-contribution-settings-btn" type="button">
            Contribution settings <ChevronDown size={13} />
          </button>
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
