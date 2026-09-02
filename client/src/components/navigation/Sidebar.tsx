import {
  Bell,
  CalendarDays,
  CircleHelp,
  LogOut,
  Moon,
  MoreVertical,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useSidebar } from "@/lib/sidebar-store";
import { useTheme } from "@/contexts/ThemeContext";

const nav = [
  { label: "Home", path: "/overview" },
  { label: "Workouts", path: "/exercise-library" },
  { label: "Nutrition", path: "/log-food" },
  { label: "GPS trace", path: "/gps" },
  { label: "Progress", path: "/log-weight" },
  { label: "Achievements", path: "/achievements" },
  { label: "Body Map", path: "/body-map" },
  { label: "Profile", path: "/profile" },
];

export function Sidebar() {
  const { open, toggleSidebar, setSidebarOpen } = useSidebar();
  const [location, setLocation] = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const { theme, toggleTheme } = useTheme();

  const isPathActive = (path: string) => {
    if (path === "/overview" && (location === "/" || location === "/overview" || location === "/home")) return true;
    if (path === "/profile" && (location === "/profile" || location === "/settings")) return true;
    return location === path;
  };

  // Close sidebar on ESC key or any outside click
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(target) &&
        !target.closest(".editorial-sidebar-trigger")
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setSidebarOpen]);

  const route = (path: string) => {
    setLocation(path);
    setSidebarOpen(false);
  };

  const isDark = theme === "dark";

  return (
    <>
      {/* 3-Dots Top Left Menu Toggle Button (Visible ONLY when sidebar is closed) */}
      {!open && (
        <button
          className="editorial-sidebar-trigger"
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
          aria-label="Open navigation menu"
          title="Menu (Open Sidebar)"
          style={{
            position: "fixed",
            top: "18px",
            left: "18px",
            zIndex: 90,
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            border: isDark ? "1px solid rgba(186, 255, 87, 0.4)" : "1px solid rgba(20, 36, 54, 0.15)",
            backgroundColor: isDark ? "#0d1410" : "#ffffff",
            color: isDark ? "#baff57" : "#060b11",
            boxShadow: isDark ? "0 4px 16px rgba(0, 0, 0, 0.4)" : "0 2px 10px rgba(0, 0, 0, 0.08)",
            transition: "all 0.18s ease",
          }}
        >
          <MoreVertical size={20} />
        </button>
      )}

      {/* Editorial Navigation Drawer */}
      <aside
        ref={sidebarRef}
        className={`editorial-sidebar ${open ? "open" : ""}`}
        aria-hidden={!open}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "260px",
          maxWidth: "85vw",
          height: "100vh",
          zIndex: 100,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: open
            ? (isDark ? "20px 0 60px rgba(0, 0, 0, 0.7)" : "20px 0 50px rgba(20, 36, 54, 0.15)")
            : "none",
          backgroundColor: isDark ? "#0b120e" : "#ffffff",
          borderRight: isDark ? "1px solid rgba(186, 255, 87, 0.2)" : "1px solid rgba(20, 36, 54, 0.08)",
          padding: "24px 20px 24px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand Header with Close Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
            paddingBottom: "12px",
            borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(20, 36, 54, 0.06)",
          }}
        >
          <div
            onClick={() => route("/overview")}
            title="FitTrack Performance"
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <span
              style={{
                fontFamily: '"Chakra Petch", sans-serif',
                fontSize: "17px",
                fontWeight: 800,
                letterSpacing: "0.22em",
                color: isDark ? "#ffffff" : "#060b11",
                textTransform: "uppercase",
              }}
            >
              FITTRACK
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(false);
            }}
            aria-label="Close sidebar"
            title="Close sidebar"
            style={{
              background: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(20, 36, 54, 0.05)",
              border: "none",
              color: isDark ? "#baff57" : "#060b11",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Text Navigation Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {nav.map(({ label, path }) => {
            const active = isPathActive(path);
            return (
              <button
                key={label}
                onClick={() => route(path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontFamily: '"Manrope", sans-serif',
                  fontSize: "14px",
                  fontWeight: active ? 700 : 500,
                  color: active
                    ? (isDark ? "#baff57" : "#060b11")
                    : (isDark ? "#94a3b8" : "#475569"),
                  backgroundColor: active
                    ? (isDark ? "rgba(186, 255, 87, 0.1)" : "rgba(20, 36, 54, 0.06)")
                    : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: "0",
                      top: "6px",
                      bottom: "6px",
                      width: "3px",
                      backgroundColor: isDark ? "#baff57" : "#060b11",
                      borderRadius: "0 2px 2px 0",
                    }}
                  />
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(20, 36, 54, 0.06)",
          }}
        >
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12.5px",
              color: isDark ? "#94a3b8" : "#64748b",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "6px",
              textAlign: "left",
            }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <button
            onClick={() => route("/notifications")}
            title="Notifications"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12.5px",
              color: isDark ? "#94a3b8" : "#64748b",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "6px",
              textAlign: "left",
            }}
          >
            <Bell size={15} />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => route("/profile")}
            title="Contribution Ledger"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12.5px",
              color: isDark ? "#94a3b8" : "#64748b",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "6px",
              textAlign: "left",
            }}
          >
            <CalendarDays size={15} />
            <span>Contributions</span>
          </button>

          <button
            onClick={() => route("/support")}
            title="Support"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12.5px",
              color: isDark ? "#94a3b8" : "#64748b",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "6px",
              textAlign: "left",
            }}
          >
            <CircleHelp size={15} />
            <span>Support</span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("fittrack_auth_state");
              localStorage.removeItem("fittrack_user_email");
              localStorage.removeItem("fittrack_user_name");
              localStorage.removeItem("fittrack_user_avatar");
              localStorage.removeItem("manus-runtime-user-info");
              try { sessionStorage.removeItem("manus-cookie"); } catch {}
              route("/");
            }}
            title="Sign out"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12.5px",
              color: "#ef4444",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "6px",
              textAlign: "left",
            }}
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Clean Subtle Backdrop Scrim with Instant Click-to-Close */}
      {open && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(false);
          }}
          aria-label="Close overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: isDark ? "rgba(0, 0, 0, 0.45)" : "rgba(15, 23, 42, 0.2)",
            backdropFilter: "blur(2px)",
            zIndex: 95,
            cursor: "pointer",
          }}
        />
      )}
    </>
  );
}
