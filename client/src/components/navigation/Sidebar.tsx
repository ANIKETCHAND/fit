/** Kinetic Anatomy Lab: an accessible, toggleable navigation drawer with three dots trigger and click-outside dismissal */
import {
  Activity,
  Award,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Dumbbell,
  Gauge,
  LogOut,
  MapPinned,
  MoreVertical,
  Settings,
  UserRound,
  Utensils,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useSidebar } from "@/lib/sidebar-store";

const nav = [
  { label: "Overview", icon: Gauge, path: "/overview" },
  { label: "3D Body Map", icon: Activity, path: "/body-map" },
  { label: "Workouts", icon: Dumbbell, path: "/exercise-library" },
  { label: "Nutrition", icon: Utensils, path: "/log-food" },
  { label: "Progress", icon: ChartNoAxesCombined, path: "/log-weight" },
  { label: "GPS trace", icon: MapPinned, path: "/gps" },
  { label: "Achievements", icon: Award, path: "/achievements" },
  { label: "Notifications", icon: Bell, path: "/notifications" },
];

export function Sidebar() {
  const { open, toggleSidebar, setSidebarOpen } = useSidebar();
  const [location, setLocation] = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement)?.closest(".sidebar-trigger-btn")
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
      <button
        className="sidebar-trigger-btn"
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
        title="Menu"
      >
        <MoreVertical size={20} />
      </button>

      <aside
        ref={sidebarRef}
        className={`sidebar ${open ? "open" : ""}`}
        aria-hidden={!open}
      >
        <div className="brand-row">
          <div className="brand-logo-icon" style={{ width: 34, height: 34, borderRadius: 8, background: "radial-gradient(circle, rgba(186,255,87,0.2) 0%, rgba(13,24,16,0.95) 100%)", border: "1px solid rgba(186,255,87,0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#baff57", boxShadow: "0 0 14px rgba(186,255,87,0.25)", flexShrink: 0, marginRight: 10 }}>
            <Activity size={20} />
          </div>
          <div>
            <strong>FIT<span>TRACK</span></strong>
            <small>PERFORMANCE OS</small>
          </div>
        </div>

        <nav>
          {nav.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              className={location === path ? "nav-item active" : "nav-item"}
              onClick={() => route(path)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {location === path && <i />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={location === "/profile" ? "nav-item active" : "nav-item"}
            onClick={() => route("/profile")}
          >
            <CalendarDays size={18} />
            <span>Contributions</span>
            {location === "/profile" && <i />}
          </button>
          <button
            className={location === "/settings" ? "nav-item active" : "nav-item"}
            onClick={() => route("/settings")}
          >
            <UserRound size={18} />
            <span>Profile</span>
            {location === "/settings" && <i />}
          </button>
          <button
            className="nav-item"
            onClick={() => route("/support")}
          >
            <CircleHelp size={18} />
            <span>Support</span>
            {location === "/support" && <i />}
          </button>
          <button
            className="nav-item"
            onClick={() => {
              localStorage.removeItem("fittrack_auth_state");
              localStorage.removeItem("fittrack_user_email");
              localStorage.removeItem("fittrack_user_name");
              localStorage.removeItem("fittrack_user_avatar");
              localStorage.removeItem("manus-runtime-user-info");
              try { sessionStorage.removeItem("manus-cookie"); } catch {}
              route("/");
            }}
            title="Sign out to landing page"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="nav-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}
    </>
  );
}
