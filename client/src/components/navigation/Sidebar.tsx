/** Kinetic Anatomy Lab: a slim navigation rail that keeps the body stage visually dominant. */
/* Carbon Command Deck: the persistent rail uses precise routing and quiet utility controls within the anatomy-first shell. */
import { Activity, Award, Bell, ChartNoAxesCombined, ChevronRight, CircleHelp, Dumbbell, Gauge, MapPinned, Menu, Settings, Sparkles, UserRound, Utensils, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const nav = [
  { label: "Overview", icon: Gauge, path: "/" },
  { label: "Glowinn Hero", icon: Sparkles, path: "/glowinn" },
  { label: "Body map", icon: Activity, path: "/#body-map" },
  { label: "Workouts", icon: Dumbbell, path: "/exercise-library" },
  { label: "Nutrition", icon: Utensils, path: "/log-food" },
  { label: "Progress", icon: ChartNoAxesCombined, path: "/log-weight" },
  { label: "GPS trace", icon: MapPinned, path: "/gps" },
  { label: "Achievements", icon: Award, path: "/achievements" },
  { label: "Notifications", icon: Bell, path: "/notifications" },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const route = (path: string) => {
    if (path.includes("#")) {
      setLocation("/");
      window.setTimeout(() => document.querySelector(".body-stage")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    } else {
      setLocation(path);
    }
    setOpen(false);
  };

  return (
    <>
      <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation">
        <Menu size={21} />
      </button>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand-row">
          <img src="/manus-storage/fittrack-signal-mark_e3117665.png" alt="FitTrack mark" />
          <div>
            <strong>FIT<span>TRACK</span></strong>
            <small>PERFORMANCE OS</small>
          </div>
          <button className="close-menu" onClick={() => setOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>
        <nav>
          {nav.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              className={location === path || (path === "/" && location === "/") ? "nav-item active" : "nav-item"}
              onClick={() => route(path)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {location === path && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className={location === "/profile" ? "nav-item active" : "nav-item"} onClick={() => route("/profile")}>
            <UserRound size={18} />
            <span>Profile analytics</span>
            {location === "/profile" && <i />}
          </button>
          <button className={location === "/settings" ? "nav-item active" : "nav-item"} onClick={() => route("/settings")}>
            <Settings size={18} />
            <span>Settings</span>
            {location === "/settings" && <i />}
          </button>
          <button className={location === "/support" ? "nav-item active" : "nav-item"} onClick={() => route("/support")}>
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
      {open && <button className="nav-scrim" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
    </>
  );
}
