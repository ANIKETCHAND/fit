/** Kinetic Anatomy Lab: an accessible, toggleable navigation drawer with three dots trigger and click-outside dismissal */
import {
  Award,
  Bell,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Dumbbell,
  Gauge,
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
  { label: "Overview", icon: Gauge, path: "/" },
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
          <img src="/manus-storage/fittrack-signal-mark_e3117665.png" alt="FitTrack mark" />
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
            <UserRound size={18} />
            <span>Profile analytics</span>
            {location === "/profile" && <i />}
          </button>
          <button
            className={location === "/settings" ? "nav-item active" : "nav-item"}
            onClick={() => route("/settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
            {location === "/settings" && <i />}
          </button>
          <button
            className={location === "/support" ? "nav-item active" : "nav-item"}
            onClick={() => route("/support")}
          >
            <CircleHelp size={18} />
            <span>Support</span>
            {location === "/support" && <i />}
          </button>
          <div className="coach-card">
            <div className="coach-orb">A</div>
            <div>
              <span>Your coach</span>
              <b>Alex Mercer</b>
            </div>
            <ChevronRight size={16} />
          </div>
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
