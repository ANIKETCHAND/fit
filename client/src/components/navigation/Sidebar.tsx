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

  return (
    <>
      {/* 3-Dots Top Left Menu Toggle Button - ALWAYS Visible */}
      <button
        className="editorial-sidebar-trigger"
        onClick={(e) => {
          e.stopPropagation();
          toggleSidebar();
        }}
        aria-label="Toggle navigation menu"
        title={open ? "Close Menu" : "Menu (Click to open sidebar)"}
        style={{
          position: "fixed",
          top: "18px",
          left: "18px",
          zIndex: 9999,
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          border: theme === "dark" ? "1px solid rgba(186, 255, 87, 0.45)" : "1px solid rgba(20, 36, 54, 0.18)",
          backgroundColor: theme === "dark" ? "rgba(10, 16, 12, 0.92)" : "rgba(255, 255, 255, 0.95)",
          color: theme === "dark" ? "#baff57" : "#060b11",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(12px)",
          transition: "all 0.18s ease",
        }}
      >
        <MoreVertical size={22} />
      </button>

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
          zIndex: 10000,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: open ? "16px 0 50px rgba(0, 0, 0, 0.6)" : "none",
          backgroundColor: theme === "dark" ? "rgba(10, 15, 12, 0.98)" : "#ffffff",
          backdropFilter: "blur(20px)",
          borderRight: theme === "dark" ? "1px solid rgba(186, 255, 87, 0.2)" : "1px solid rgba(20, 36, 54, 0.08)",
          padding: "32px 24px 28px 28px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand Header */}
        <div
          className="editorial-brand-row"
          onClick={() => route("/overview")}
          title="FitTrack Performance"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", cursor: "pointer" }}
        >
          <span className="editorial-wordmark" style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: "16px", fontWeight: 800, letterSpacing: "0.22em", color: theme === "dark" ? "#edf4eb" : "#060b11" }}>
            FITTRACK
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(false);
            }}
            aria-label="Close sidebar"
            title="Close sidebar"
            style={{
              background: "transparent",
              border: "none",
              color: theme === "dark" ? "#8a988c" : "#64748b",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Text Navigation Links */}
        <nav className="editorial-nav-list" style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {nav.map(({ label, path }) => {
            const active = isPathActive(path);
            return (
              <button
                key={label}
                className={`editorial-nav-item ${active ? "active" : ""}`}
                onClick={() => route(path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontFamily: '"Manrope", sans-serif',
                  fontSize: "14.5px",
                  fontWeight: active ? 700 : 500,
                  color: active
                    ? (theme === "dark" ? "#ffffff" : "#060b11")
                    : (theme === "dark" ? "#8b978e" : "#748392"),
                  background: "none",
                  border: "none",
                  padding: "6px 0",
                  textAlign: "left",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: "-18px",
                      width: "3px",
                      height: "18px",
                      backgroundColor: theme === "dark" ? "#baff57" : "#1d4ed8",
                      borderRadius: "2px",
                    }}
                  />
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="editorial-sidebar-bottom" style={{ marginTop: "auto", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px", borderTop: theme === "dark" ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(20, 36, 54, 0.06)" }}>
          <button
            className="editorial-nav-item sub-item"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px", color: "#8a988c", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <button
            className="editorial-nav-item sub-item"
            onClick={() => route("/notifications")}
            title="Notifications"
            style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px", color: "#8a988c", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
          >
            <Bell size={15} />
            <span>Notifications</span>
          </button>

          <button
            className="editorial-nav-item sub-item"
            onClick={() => route("/profile")}
            title="Contribution Ledger"
            style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px", color: "#8a988c", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
          >
            <CalendarDays size={15} />
            <span>Contributions</span>
          </button>

          <button
            className="editorial-nav-item sub-item"
            onClick={() => route("/support")}
            title="Support"
            style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px", color: "#8a988c", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
          >
            <CircleHelp size={15} />
            <span>Support</span>
          </button>

          <button
            className="editorial-nav-item sub-item"
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
            style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px", color: "#8a988c", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Full-Screen Backdrop Scrim with Instant Click-to-Close */}
      {open && (
        <div
          className="editorial-scrim"
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
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9998,
            cursor: "pointer",
          }}
        />
      )}
    </>
  );
}
