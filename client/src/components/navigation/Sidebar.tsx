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

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement)?.closest(".editorial-sidebar-trigger")
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open, setSidebarOpen]);

  const route = (path: string) => {
    setLocation(path);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* 3-Dots Top Left Menu Toggle Button */}
      <button
        className={`editorial-sidebar-trigger ${open ? "is-open" : ""}`}
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
        title={open ? "Close Menu" : "Menu (Open Sidebar)"}
      >
        <MoreVertical size={20} />
      </button>

      {/* Editorial Navigation Drawer */}
      <aside
        ref={sidebarRef}
        className={`editorial-sidebar ${open ? "open" : ""}`}
        aria-hidden={!open}
      >
        {/* Brand Header */}
        <div
          className="editorial-brand-row"
          onClick={() => route("/overview")}
          title="FitTrack Performance"
        >
          <span className="editorial-wordmark">FITTRACK</span>
          <button
            className="editorial-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(false);
            }}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Text Navigation Links */}
        <nav className="editorial-nav-list">
          {nav.map(({ label, path }) => {
            const active = isPathActive(path);
            return (
              <button
                key={label}
                className={`editorial-nav-item ${active ? "active" : ""}`}
                onClick={() => route(path)}
              >
                {active && <span className="active-indicator" />}
                <span className="nav-label-text">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="editorial-sidebar-bottom">
          <button
            className="editorial-nav-item sub-item"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            <span className="nav-label-text">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <button
            className="editorial-nav-item sub-item"
            onClick={() => route("/notifications")}
            title="Notifications"
          >
            <Bell size={15} />
            <span className="nav-label-text">Notifications</span>
          </button>

          <button
            className="editorial-nav-item sub-item"
            onClick={() => route("/profile")}
            title="Contribution Ledger"
          >
            <CalendarDays size={15} />
            <span className="nav-label-text">Contributions</span>
          </button>

          <button
            className="editorial-nav-item sub-item"
            onClick={() => route("/support")}
            title="Support"
          >
            <CircleHelp size={15} />
            <span className="nav-label-text">Support</span>
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
          >
            <LogOut size={15} />
            <span className="nav-label-text">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop Scrim */}
      {open && (
        <div
          className="editorial-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close overlay"
        />
      )}
    </>
  );
}
