import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { FaBars, FaXmark, FaArrowRightFromBracket, FaMagnifyingGlass } from "react-icons/fa6";
import { useAuth } from "./AuthProvider";
import Logo from "./Logo";
import { DUR, EASE_OUT } from "../motion";

const LINKS = [
  ["/", "Dashboard"],
  ["/calendar", "Calendar"],
  ["/favorites", "Favorites"],
];

const HeaderNav = ({ onSearch }) => {
  const [open, setOpen] = useState(false);
  const { user, enabled, authReady, signOutUser } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSignOut = async () => {
    await signOutUser().catch(() => {});
    if (pathname === "/favorites") navigate("/", { viewTransition: true });
  };

  const linkClass = ({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`;
  const links = LINKS.map(([to, label]) => (
    <NavLink key={to} to={to} end={to === "/"} className={linkClass} viewTransition>
      {label}
    </NavLink>
  ));

  const account = !authReady ? (
    // Reserve the button's space while Firebase restores the session.
    <span className="nav__auth-placeholder" aria-hidden="true" />
  ) : user ? (
    <div className="nav__user-wrap">
      <span className="nav__user" title={user.email ?? undefined}>
        {user.displayName || user.email || "Signed in"}
      </span>
      <button type="button" className="btn btn--quiet" onClick={handleSignOut}>
        <FaArrowRightFromBracket aria-hidden="true" />
        Sign out
      </button>
    </div>
  ) : enabled && pathname !== "/login" ? (
    <Link to="/login" state={{ from: pathname }} className="btn btn--primary" viewTransition>
      Sign in
    </Link>
  ) : (
    <span className="nav__auth-placeholder" aria-hidden="true" />
  );

  return (
    <header className="nav">
      <div className="nav__bar">
        <Link to="/" className="brand" aria-label="F1 Dash home" viewTransition>
          <Logo size={30} />
          <span className="brand__word">Dash</span>
        </Link>

        <nav className="nav__links" aria-label="Main">
          {links}
        </nav>

        <span className="nav__spacer" />

        <button type="button" className="nav__search" onClick={onSearch} aria-keyshortcuts="/">
          <FaMagnifyingGlass aria-hidden="true" />
          <span className="nav__search-text">Search</span>
          <kbd aria-hidden="true">/</kbd>
        </button>

        <div className="nav__account">{account}</div>

        <button
          type="button"
          className="nav__toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <FaXmark size={18} /> : <FaBars size={18} />}
        </button>
      </div>

      {/* Mobile menu: drops from the bar it belongs to, and returns to it. */}
      <AnimatePresence>
        {open && (
          <m.nav
            id="nav-menu"
            className="nav__menu"
            aria-label="Main"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: DUR.fast } }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
          >
            {links}
            <div className="nav__menu-account">{account}</div>
          </m.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default HeaderNav;
