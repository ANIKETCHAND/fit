import { useState, useEffect } from "react";
import { Cloudmark, MenuIcon } from "./icons";
import "./Navbar.css";

const LINKS = ["Home", "Products", "Our business", "Clients", "About"];

export function Navbar() {
  const [active, setActive] = useState("Home");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="nav">
      <div className="nav__inner shell">
        {/* 1. BRAND */}
        <a className="nav__brand" href="#top">
          <Cloudmark />
          <span>Glowinn</span>
        </a>

        {/* 2. RAIL */}
        <nav className="nav__rail" aria-label="Primary">
          {LINKS.map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={active === label ? "is-active" : ""}
              onClick={() => setActive(label)}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* 3. ACTIONS */}
        <div className="nav__actions">
          <a className="nav__register" href="#register">
            Register
          </a>
          <a className="btn btn--ink" href="#buy">
            Buy Now
          </a>
        </div>

        {/* 4. TOGGLE */}
        <button
          type="button"
          className="nav__toggle"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <MenuIcon open={open} />
        </button>
      </div>

      {/* MOBILE SHEET */}
      {open && (
        <div className="nav__sheet">
          {LINKS.map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={active === label ? "is-active" : ""}
              onClick={() => {
                setActive(label);
                setOpen(false);
              }}
            >
              {label}
            </a>
          ))}
          <a
            href="#register"
            onClick={() => setOpen(false)}
          >
            Register
          </a>
          <a
            className="btn btn--pearl"
            href="#buy"
            onClick={() => setOpen(false)}
          >
            Buy Now
          </a>
        </div>
      )}
    </header>
  );
}

export default Navbar;
